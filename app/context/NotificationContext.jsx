import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import { useLocationTracking } from "../hooks/useLocationTracking";
import { useLocationPermissionMonitor } from "../hooks/useLocationPermissionMonitor";
import socketService from "../api/driverSocket";
import { useTripStore } from "../store/useTripStore";
import { useAuthStore } from "../store/authStore";
import { handleNotificationNavigation } from "../notification/notificationHandler";

const NotificationContext = createContext(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [error, setError] = useState(null);

  const { user } = useAuthStore();
  const notificationListener = useRef();
  const responseListener = useRef();
  const appStateRef = useRef(AppState.currentState);
  const backgroundTaskTimeoutRef = useRef(null);

  const { 
    startTracking, 
    stopTracking, 
    isTracking, 
    trackingState,
    handlePermissionNotification,
    getTrackingStatus,
    syncTrackingState
  } = useLocationTracking();
  
  const { 
    checkCurrentStatus: checkPermissionStatus,
    isMonitoring: isPermissionMonitoring 
  } = useLocationPermissionMonitor();
  
  const { setActiveTripId, clearActiveTripId, activeTripId } = useTripStore();

  const pendingTrackingRequest = useRef(null);
  const socketAcknowledgmentSent = useRef(new Set());

  const logWithTimestamp = useCallback(() => {}, []);

  const handleLocationRequest = useCallback(async ({ tripId, source = 'server_request' }) => {
    logWithTimestamp(`🔍 IMMEDIATE LOCATION REQUEST for trip: ${tripId} from ${source}`);
    
    try {
      const success = await socketService.sendLocationForTracking(tripId);
      
      if (success) {
        logWithTimestamp(`✅ Successfully sent immediate location for trip: ${tripId}`);
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'location_sent',
          message: 'Driver location sent successfully'
        });
      } else {
        logWithTimestamp(`❌ Failed to send immediate location for trip: ${tripId}`);
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'location_failed',
          reason: 'location_unavailable',
          message: 'Unable to get current location'
        });
      }
    } catch (error) {
      logWithTimestamp(`💥 Error handling location request:`, error);
      socketService.emit('trackingRequestResponse', { 
        tripId, 
        status: 'location_failed',
        reason: 'technical_error',
        message: error.message
      });
    }
  }, []);

  const handleStartTrackingRequest = useCallback(
    async (tripId, source = 'unknown') => {
      logWithTimestamp(`🔥🔥🔥 START TRACKING REQUEST RECEIVED for trip: ${tripId} from ${source} 🔥🔥🔥`);
      logWithTimestamp(`Current app state: ${appStateRef.current}`);
      logWithTimestamp(`Current active trip: ${activeTripId}`);
      logWithTimestamp(`Currently tracking: ${isTracking()}`);
      
  if (socketAcknowledgmentSent.current.has(tripId)) return;
      
  socketAcknowledgmentSent.current.add(tripId);
      
      try {
        socketService.emit('trackingRequestReceived', { tripId, status: 'processing' });
      } catch (socketError) {
        logWithTimestamp(`❌ Failed to send acknowledgment:`, socketError);
      }
      
      if (isTracking() && activeTripId === tripId) {
        socketService.emit('trackingRequestResponse', { tripId, status: 'already_tracking' });
        return;
      }
      
      if (isTracking() && activeTripId !== tripId) {
        await stopTracking();
        clearActiveTripId();
      }

  const permissionStatus = await checkPermissionStatus();
      
      if (!permissionStatus.locationServicesEnabled) {
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'location_services_disabled',
          message: 'Location services are disabled. Please enable location services in device settings.'
        });
        socketAcknowledgmentSent.current.delete(tripId);
        return;
      }
      
      if (!permissionStatus.foregroundGranted) {
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'foreground_permission_denied',
          message: 'Location permission is required for tracking. Please grant location permission in app settings.'
        });
        socketAcknowledgmentSent.current.delete(tripId);
        return;
      }
      
      if (!permissionStatus.backgroundGranted) {
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'background_permission_denied',
          message: 'Background location permission is required. Please select "Allow all the time" in location settings.'
        });
        socketAcknowledgmentSent.current.delete(tripId);
        return;
      }

      const requestData = { tripId, timestamp: Date.now(), source };
      if (appStateRef.current !== 'active') {
        pendingTrackingRequest.current = requestData;
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Location Tracking Required",
              body: "Tap to start sharing your location for the trip",
              data: { action: "BRING_TO_FOREGROUND", tripId },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              categoryIdentifier: "TRACKING_REQUEST",
            },
            trigger: null,
          });
        } catch (notifError) {}
      }
      
      setActiveTripId(tripId);
      try {
        const success = await startTracking(tripId);
        if (success) {
          socketService.emit('trackingRequestResponse', { tripId, status: 'started' });
          if (pendingTrackingRequest.current?.tripId === tripId) pendingTrackingRequest.current = null;
        } else {
          clearActiveTripId();
          let failureReason = 'unknown';
          let message = 'Failed to start location tracking';
          if (trackingState.permissionDenied) {
            failureReason = 'permission_denied';
            message = 'Location permission denied';
          } else if (trackingState.locationServicesDisabled) {
            failureReason = 'location_services_disabled';
            message = 'Location services are disabled';
          } else if (trackingState.needsBackgroundPermission) {
            failureReason = 'background_permission_needed';
            message = 'Background location permission required';
          } else if (trackingState.error) {
            failureReason = 'technical_error';
            message = trackingState.error;
          }
          socketService.emit('trackingRequestResponse', { 
            tripId, 
            status: 'failed',
            reason: failureReason,
            message: message
          });
        }
      } catch (error) {
        clearActiveTripId();
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'technical_error',
          message: error.message
        });
      } finally {
        socketAcknowledgmentSent.current.delete(tripId);
      }
    },
    [isTracking, startTracking, setActiveTripId, clearActiveTripId, trackingState, checkPermissionStatus, activeTripId, stopTracking]
  );

  const handleStopTrackingRequest = useCallback(async (tripId = null) => {
    if (!isTracking()) {
      socketService.emit('stopTrackingResponse', { status: 'not_tracking', tripId });
      return;
    }
    if (tripId && activeTripId !== tripId) {
      socketService.emit('stopTrackingResponse', { status: 'different_trip', tripId, currentTrip: activeTripId });
      return;
    }
    try {
      const success = await stopTracking();
      const stoppedTripId = activeTripId;
      clearActiveTripId();
      pendingTrackingRequest.current = null;
      if (success) {
        socketService.emit('stopTrackingResponse', { status: 'stopped', tripId: stoppedTripId });
      } else {
        socketService.emit('stopTrackingResponse', { 
          status: 'error', 
          error: trackingState.error, 
          tripId: stoppedTripId 
        });
      }
    } catch (error) {
      clearActiveTripId();
      socketService.emit('stopTrackingResponse', { 
        status: 'error', 
        error: error.message, 
        tripId: activeTripId 
      });
    }
  }, [isTracking, stopTracking, clearActiveTripId, trackingState, activeTripId]);

  const handleBackgroundTask = useCallback(async (taskData) => {
    if (backgroundTaskTimeoutRef.current) clearTimeout(backgroundTaskTimeoutRef.current);
    backgroundTaskTimeoutRef.current = setTimeout(() => {}, 25000);
    try {
      const { action, tripId } = taskData;
      if (action === 'START_TRACKING' && tripId) await handleStartTrackingRequest(tripId, 'background_task');
    } catch (error) {} finally {
      if (backgroundTaskTimeoutRef.current) {
        clearTimeout(backgroundTaskTimeoutRef.current);
        backgroundTaskTimeoutRef.current = null;
      }
    }
  }, [handleStartTrackingRequest]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;
      if (nextAppState === 'active' && previousState.match(/inactive|background/)) {
        await syncTrackingState();
        if (pendingTrackingRequest.current) {
          const { tripId, timestamp } = pendingTrackingRequest.current;
          const age = Date.now() - timestamp;
          if (age < 10 * 60 * 1000) {
            pendingTrackingRequest.current = null;
            setTimeout(() => {
              handleStartTrackingRequest(tripId, 'pending_request');
            }, 1000);
          } else {
            pendingTrackingRequest.current = null;
          }
        }
      }
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        if (isTracking() && activeTripId) {
          const status = await getTrackingStatus();
          if (!status.isRunning) {
            try {
              socketService.emit('trackingInterrupted', { 
                tripId: activeTripId, 
                reason: 'task_stopped_background' 
              });
            } catch (error) {}
          }
        }
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription?.remove();
    };
  }, [handleStartTrackingRequest, isTracking, getTrackingStatus, activeTripId, syncTrackingState]);

  useEffect(() => {
    logWithTimestamp(`🔧 Setting up NotificationProvider - User: ${user ? `${user.role} (${user.email})` : 'not authenticated'}`);
    
    // 1. Register for push notifications (FOR ALL USERS)
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          logWithTimestamp("📱 Acquired Expo Push Token:", token);
          setExpoPushToken(token);
        }
      })
      .catch((err) => logWithTimestamp("❌ Failed to get push token:", err));

    // 2. Listen for push notifications when app is in foreground (FOR ALL USERS)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const notificationData = notification.request.content.data;
      const { action, tripId, permissionType, type, payload } = notificationData;
      
      logWithTimestamp(`🔔 Notification received in foreground:`, { 
        action, 
        tripId, 
        permissionType,
        type,
        payload,
        appState: appStateRef.current 
      });
      
      setNotification(notification);
      
      // Handle driver-specific tracking notifications
      if (user?.role === 'driver') {
        if (action === "START_TRACKING" && tripId) {
          logWithTimestamp("🎯 Start tracking notification - processing");
          handleStartTrackingRequest(tripId, 'foreground_notification');
        } else if (action === "BRING_TO_FOREGROUND") {
          logWithTimestamp("📱 Bring to foreground notification - app already active");
          // App is already active, process immediately if pending
          if (pendingTrackingRequest.current?.tripId === tripId) {
            handleStartTrackingRequest(tripId, 'foreground_bring_up');
          }
        } else if (action === "PERMISSION_REQUIRED" && permissionType) {
          logWithTimestamp("🔐 Permission required notification received");
          // Just show the notification, user will tap to handle
        }
      }
      
      // Handle regular push notifications for all users (truck owners & drivers)
      if (type && payload) {
        logWithTimestamp("🔔 Regular push notification received:", { type, payload });
        // Just show the notification in foreground - navigation will be handled on tap
      }
    });

    // 3. Listen for notification taps (when app is in background/killed) (FOR ALL USERS)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const notificationData = response.notification.request.content.data;
      const { action, tripId, permissionType, type, payload } = notificationData;
      
      logWithTimestamp(`👆 Notification tapped:`, { 
        action, 
        tripId, 
        permissionType, 
        type, 
        payload,
        appState: appStateRef.current 
      });
      
      // Handle driver-specific tracking notification taps
      if (user?.role === 'driver') {
        if (action === "BRING_TO_FOREGROUND" && tripId) {
          logWithTimestamp(`📱 Setting pending tracking request for trip: ${tripId}`);
          pendingTrackingRequest.current = { tripId, timestamp: Date.now(), source: 'notification_tap' };
        } else if (action === "START_TRACKING" && tripId) {
          logWithTimestamp(`🎯 Direct start tracking from notification tap for trip: ${tripId}`);
          // Handle immediately if app becomes active, or store as pending
          if (appStateRef.current === 'active') {
            handleStartTrackingRequest(tripId, 'notification_tap_active');
          } else {
            pendingTrackingRequest.current = { tripId, timestamp: Date.now(), source: 'notification_tap_background' };
          }
        } else if (action === "PERMISSION_REQUIRED" && permissionType) {
          logWithTimestamp(`🔐 Opening settings for permission: ${permissionType}`);
          handlePermissionNotification(permissionType);
        } else if (action === "BRING_TO_FOREGROUND_ERROR" && tripId) {
          logWithTimestamp(`🔄 Retrying tracking after foreground error for trip: ${tripId}`);
          pendingTrackingRequest.current = { tripId, timestamp: Date.now(), source: 'error_retry' };
        }
      }
      
      // Handle regular push notification taps for all users (truck owners & drivers)
      if (type && payload) {
        logWithTimestamp("👆 Regular notification tapped - navigating:", { type, payload });
        handleNotificationNavigation({ type, payload });
      }
    });

    // 4. Socket setup ONLY for authenticated drivers
    if (user?.role === 'driver' && user?.email) {
      logWithTimestamp(`🔌 Authenticated driver detected, setting up socket...`);
      
      // Define socket event handlers
      const handleSocketStart = ({ tripId }) => {
        logWithTimestamp(`🎯🎯🎯 SOCKET EVENT: requestLocationUpdates for trip: ${tripId} 🎯🎯🎯`);
        handleStartTrackingRequest(tripId, 'socket_request');
      };

      // Handle immediate location requests
      const handleSocketLocationRequest = ({ tripId }) => {
        logWithTimestamp(`🔍🎯 SOCKET EVENT: requestImmediateLocation for trip: ${tripId}`);
        handleLocationRequest({ tripId, source: 'socket_location_request' });
      };
      
      const handleSocketStop = ({ tripId }) => {
        logWithTimestamp(`🎯 SOCKET EVENT: stopLocationUpdates for trip: ${tripId}`);
        handleStopTrackingRequest(tripId);
      };

      const handleSocketError = (error) => {
        logWithTimestamp(`❌ Socket error:`, error);
      };

      const handleSocketConnect = () => {
        logWithTimestamp(`✅ Socket connected successfully`);
        if (user.id) {
          socketService.emit('authenticate', { userId: user.id });
          logWithTimestamp(`🔐 Sent authentication for user: ${user.id}`);
        }
      };

      const handleSocketDisconnect = (reason) => {
        logWithTimestamp(`🔌 Socket disconnected:`, reason);
      };

      logWithTimestamp(`🔐 Registering socket event listeners...`);
      socketService.on("requestLocationUpdates", handleSocketStart);
      socketService.on("requestImmediateLocation", handleSocketLocationRequest);
      socketService.on("stopLocationUpdates", handleSocketStop);
      socketService.on("connect", handleSocketConnect);
      socketService.on("disconnect", handleSocketDisconnect);
      socketService.on("error", handleSocketError);
      logWithTimestamp(`✅ Socket event listeners registered`);

      logWithTimestamp(`🔌 Connecting to socket server...`);
      socketService.connect();
      return () => {
        logWithTimestamp(`🧹 Cleaning up NotificationProvider for driver`);
        
        if (backgroundTaskTimeoutRef.current) {
          clearTimeout(backgroundTaskTimeoutRef.current);
        }
        
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
        
        socketService.off("requestLocationUpdates", handleSocketStart);
        socketService.off("requestImmediateLocation", handleSocketLocationRequest);
        socketService.off("stopLocationUpdates", handleSocketStop);
        socketService.off("connect", handleSocketConnect);
        socketService.off("disconnect", handleSocketDisconnect);
        socketService.off("error", handleSocketError);
        
        logWithTimestamp(`🔌 Socket listeners removed but connection maintained`);
      };
    }

    // Cleanup for non-driver users (truck owners)
    return () => {
      logWithTimestamp(`🧹 Cleaning up NotificationProvider for non-driver user`);
      
      if (backgroundTaskTimeoutRef.current) {
        clearTimeout(backgroundTaskTimeoutRef.current);
      }
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user, handleStartTrackingRequest, handleStopTrackingRequest, handlePermissionNotification, handleLocationRequest]);

  const contextValue = {
    expoPushToken,
    notification,
    error,
    trackingInfo: {
      isTracking: isTracking(),
      activeTripId,
      trackingState,
      hasPendingRequest: !!pendingTrackingRequest.current,
      pendingRequest: pendingTrackingRequest.current,
      permissionMonitoring: isPermissionMonitoring,
      socketConnected: socketService.socket?.connected || false
    },
    debugMethods: {
      syncTrackingState,
      getTrackingStatus,
      checkPermissions: checkPermissionStatus
    }
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};