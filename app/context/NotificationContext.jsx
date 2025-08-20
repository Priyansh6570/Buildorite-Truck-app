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
    checkPermissions,
    syncTrackingState
  } = useLocationTracking();
  
  // Location permission monitoring for drivers
  const { 
    checkCurrentStatus: checkPermissionStatus,
    isMonitoring: isPermissionMonitoring 
  } = useLocationPermissionMonitor();
  
  const { setActiveTripId, clearActiveTripId, activeTripId } = useTripStore();

  // Store pending tracking requests when app is in background
  const pendingTrackingRequest = useRef(null);
  const socketAcknowledgmentSent = useRef(new Set());

  // Enhanced logging for debugging
  const logWithTimestamp = useCallback((message, ...args) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, ...args);
  }, []);

  // NEW: Handle immediate location requests from server
  const handleLocationRequest = useCallback(async ({ tripId, source = 'server_request' }) => {
    logWithTimestamp(`🔍 IMMEDIATE LOCATION REQUEST for trip: ${tripId} from ${source}`);
    
    try {
      // Send fresh location immediately
      const success = await socketService.sendLocationForTracking(tripId);
      
      if (success) {
        logWithTimestamp(`✅ Successfully sent immediate location for trip: ${tripId}`);
        // Send acknowledgment
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
      
      // Prevent duplicate processing
      if (socketAcknowledgmentSent.current.has(tripId)) {
        logWithTimestamp(`⚠️ Already processing trip ${tripId}, ignoring duplicate request`);
        return;
      }
      
      // Send immediate acknowledgment to server
      socketAcknowledgmentSent.current.add(tripId);
      logWithTimestamp(`📤 Sending trackingRequestReceived for trip: ${tripId}`);
      
      try {
        socketService.emit('trackingRequestReceived', { tripId, status: 'processing' });
      } catch (socketError) {
        logWithTimestamp(`❌ Failed to send acknowledgment:`, socketError);
      }
      
      // Check if already tracking for this trip
      if (isTracking() && activeTripId === tripId) {
        logWithTimestamp(`✅ Already tracking trip ${tripId}, sending success response`);
        socketService.emit('trackingRequestResponse', { tripId, status: 'already_tracking' });
        return;
      }
      
      // If tracking different trip, stop first
      if (isTracking() && activeTripId !== tripId) {
        logWithTimestamp(`🔄 Currently tracking different trip ${activeTripId}, stopping first`);
        await stopTracking();
        clearActiveTripId();
      }

      // Check permissions before proceeding (crucial for all cases)
      logWithTimestamp(`🔍 Checking permissions for trip: ${tripId}`);
      const permissionStatus = await checkPermissionStatus();
      logWithTimestamp(`Permission status:`, permissionStatus);
      
      if (!permissionStatus.locationServicesEnabled) {
        logWithTimestamp(`❌ Location services disabled for trip: ${tripId}`);
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
        logWithTimestamp(`❌ Foreground permission denied for trip: ${tripId}`);
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
        logWithTimestamp(`❌ Background permission denied for trip: ${tripId}`);
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'background_permission_denied',
          message: 'Background location permission is required. Please select "Allow all the time" in location settings.'
        });
        socketAcknowledgmentSent.current.delete(tripId);
        return;
      }

      // Store pending request for background processing
      const requestData = { tripId, timestamp: Date.now(), source };
      
      // If app is in background or not active, handle accordingly
      if (appStateRef.current !== 'active') {
        logWithTimestamp(`📱 App is in background/inactive (${appStateRef.current}), storing pending request`);
        pendingTrackingRequest.current = requestData;
        
        // For background notification, try to show high-priority notification
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
          logWithTimestamp(`📲 Background notification scheduled for trip: ${tripId}`);
        } catch (notifError) {
          logWithTimestamp(`❌ Failed to show bring-to-foreground notification:`, notifError);
        }
        
        // Try background tracking anyway since permissions are good
        logWithTimestamp(`🚀 Attempting background tracking start for trip: ${tripId}`);
      } else {
        logWithTimestamp(`📱 App is active, proceeding with foreground tracking`);
      }
      
      // Set active trip before starting
      setActiveTripId(tripId);
      
      try {
        const success = await startTracking(tripId);
        
        if (success) {
          logWithTimestamp(`✅ Successfully started tracking for trip: ${tripId}`);
          socketService.emit('trackingRequestResponse', { tripId, status: 'started' });
          
          // Clear pending request if successful
          if (pendingTrackingRequest.current?.tripId === tripId) {
            pendingTrackingRequest.current = null;
          }
        } else {
          logWithTimestamp(`❌ Failed to start tracking for trip: ${tripId}`);
          logWithTimestamp(`Tracking state:`, trackingState);
          clearActiveTripId();
          
          // Send detailed failure reason based on tracking state
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
        logWithTimestamp(`💥 Error starting tracking:`, error);
        clearActiveTripId();
        socketService.emit('trackingRequestResponse', { 
          tripId, 
          status: 'failed',
          reason: 'technical_error',
          message: error.message
        });
      } finally {
        // Always remove from acknowledgment set after processing
        socketAcknowledgmentSent.current.delete(tripId);
      }
    },
    [isTracking, startTracking, setActiveTripId, clearActiveTripId, trackingState, checkPermissionStatus, activeTripId, stopTracking]
  );

  const handleStopTrackingRequest = useCallback(async (tripId = null) => {
    logWithTimestamp(`🛑 STOP TRACKING REQUEST RECEIVED for trip: ${tripId || 'current'}`);
    
    if (!isTracking()) {
      logWithTimestamp(`⚠️ Not tracking, ignoring stop request`);
      socketService.emit('stopTrackingResponse', { status: 'not_tracking', tripId });
      return;
    }
    
    // If specific tripId provided, verify it matches current active trip
    if (tripId && activeTripId !== tripId) {
      logWithTimestamp(`⚠️ Stop request for trip ${tripId} but currently tracking ${activeTripId}`);
      socketService.emit('stopTrackingResponse', { status: 'different_trip', tripId, currentTrip: activeTripId });
      return;
    }
    
    logWithTimestamp(`🛑 Stopping tracking process for trip: ${activeTripId}`);
    try {
      const success = await stopTracking();
      const stoppedTripId = activeTripId;
      clearActiveTripId();
      pendingTrackingRequest.current = null; // Clear any pending requests
      
      if (success) {
        socketService.emit('stopTrackingResponse', { status: 'stopped', tripId: stoppedTripId });
        logWithTimestamp(`✅ Successfully stopped tracking for trip: ${stoppedTripId}`);
      } else {
        socketService.emit('stopTrackingResponse', { 
          status: 'error', 
          error: trackingState.error, 
          tripId: stoppedTripId 
        });
        logWithTimestamp(`❌ Failed to stop tracking: ${trackingState.error}`);
      }
    } catch (error) {
      logWithTimestamp(`💥 Error stopping tracking:`, error);
      clearActiveTripId();
      socketService.emit('stopTrackingResponse', { 
        status: 'error', 
        error: error.message, 
        tripId: activeTripId 
      });
    }
  }, [isTracking, stopTracking, clearActiveTripId, trackingState, activeTripId]);

  // Enhanced background task handling
  const handleBackgroundTask = useCallback(async (taskData) => {
    logWithTimestamp(`🔄 Background task execution started:`, taskData);
    
    // Clear any existing timeout
    if (backgroundTaskTimeoutRef.current) {
      clearTimeout(backgroundTaskTimeoutRef.current);
    }
    
    // Set timeout for background task
    backgroundTaskTimeoutRef.current = setTimeout(() => {
      logWithTimestamp(`⏰ Background task timeout`);
    }, 25000); // 25 second timeout for background tasks
    
    try {
      const { action, tripId } = taskData;
      
      if (action === 'START_TRACKING' && tripId) {
        await handleStartTrackingRequest(tripId, 'background_task');
      }
    } catch (error) {
      logWithTimestamp(`💥 Background task error:`, error);
    } finally {
      if (backgroundTaskTimeoutRef.current) {
        clearTimeout(backgroundTaskTimeoutRef.current);
        backgroundTaskTimeoutRef.current = null;
      }
    }
  }, [handleStartTrackingRequest]);

  // Handle app state changes with improved logic
  useEffect(() => {
    const handleAppStateChange = async (nextAppState) => {
      logWithTimestamp(`📱 App state changed from ${appStateRef.current} to ${nextAppState}`);
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // When app becomes active from background/inactive
      if (nextAppState === 'active' && previousState.match(/inactive|background/)) {
        logWithTimestamp(`🚀 App became active - checking for pending requests`);
        
        // Sync tracking state first
        await syncTrackingState();
        
        // Check for pending tracking requests
        if (pendingTrackingRequest.current) {
          const { tripId, timestamp, source } = pendingTrackingRequest.current;
          const age = Date.now() - timestamp;
          
          logWithTimestamp(`📋 Found pending request:`, { tripId, source, ageMs: age });
          
          // Check if request is still valid (within 10 minutes)
          if (age < 10 * 60 * 1000) {
            logWithTimestamp(`✅ Processing pending tracking request for trip: ${tripId}`);
            pendingTrackingRequest.current = null;
            // Small delay to ensure app is fully active
            setTimeout(() => {
              handleStartTrackingRequest(tripId, 'pending_request');
            }, 1000);
          } else {
            logWithTimestamp(`⏰ Pending tracking request expired (age: ${age}ms)`);
            pendingTrackingRequest.current = null;
          }
        }
      }

      // When app goes to background/inactive, verify tracking status
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        logWithTimestamp(`📱 App going to background, verifying tracking status`);
        
        if (isTracking() && activeTripId) {
          const status = await getTrackingStatus();
          logWithTimestamp(`📊 Tracking status in background:`, status);
          
          if (!status.isRunning) {
            logWithTimestamp(`⚠️ Location tracking stopped unexpectedly for trip ${activeTripId}`);
            // Notify server about tracking interruption
            try {
              socketService.emit('trackingInterrupted', { 
                tripId: activeTripId, 
                reason: 'task_stopped_background' 
              });
            } catch (error) {
              logWithTimestamp(`❌ Failed to emit tracking interruption:`, error);
            }
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      logWithTimestamp(`🧹 Removing app state listener`);
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
        // Authenticate immediately after connection
        if (user.id) {
          socketService.emit('authenticate', { userId: user.id });
          logWithTimestamp(`🔐 Sent authentication for user: ${user.id}`);
        }
      };

      const handleSocketDisconnect = (reason) => {
        logWithTimestamp(`🔌 Socket disconnected:`, reason);
      };

      // Register socket listeners BEFORE connecting
      logWithTimestamp(`🔐 Registering socket event listeners...`);
      socketService.on("requestLocationUpdates", handleSocketStart);
      socketService.on("requestImmediateLocation", handleSocketLocationRequest);
      socketService.on("stopLocationUpdates", handleSocketStop);
      socketService.on("connect", handleSocketConnect);
      socketService.on("disconnect", handleSocketDisconnect);
      socketService.on("error", handleSocketError);
      logWithTimestamp(`✅ Socket event listeners registered`);

      // Connect socket
      logWithTimestamp(`🔌 Connecting to socket server...`);
      socketService.connect();

      // Cleanup function for authenticated drivers
      return () => {
        logWithTimestamp(`🧹 Cleaning up NotificationProvider for driver`);
        
        // Clear timeouts
        if (backgroundTaskTimeoutRef.current) {
          clearTimeout(backgroundTaskTimeoutRef.current);
        }
        
        // Remove notification listeners
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
        
        // Remove socket listeners
        socketService.off("requestLocationUpdates", handleSocketStart);
        socketService.off("requestImmediateLocation", handleSocketLocationRequest);
        socketService.off("stopLocationUpdates", handleSocketStop);
        socketService.off("connect", handleSocketConnect);
        socketService.off("disconnect", handleSocketDisconnect);
        socketService.off("error", handleSocketError);
        
        // Don't disconnect socket - let it persist for background operations
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

  // Expose comprehensive tracking state through context
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
    // Expose methods for debugging
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