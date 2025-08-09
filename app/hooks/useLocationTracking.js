import * as Location from "expo-location";
import { useCallback, useRef, useState } from "react";
import { Linking, AppState } from "react-native";
import * as Notifications from "expo-notifications";

const BACKGROUND_LOCATION_TASK = "background-location-task";

export const useLocationTracking = () => {
  const isTrackingRef = useRef(false);
  const [trackingState, setTrackingState] = useState({
    isLoading: false,
    error: null,
    permissionDenied: false,
    locationServicesDisabled: false,
    needsBackgroundPermission: false,
    trackingActive: false
  });

  const resetState = useCallback(() => {
    console.log('[LocationTracking] Resetting tracking state');
    setTrackingState({
      isLoading: false,
      error: null,
      permissionDenied: false,
      locationServicesDisabled: false,
      needsBackgroundPermission: false,
      trackingActive: isTrackingRef.current
    });
  }, []);

  const updateState = useCallback((updates) => {
    console.log('[LocationTracking] Updating state:', updates);
    setTrackingState(prev => ({ ...prev, ...updates }));
  }, []);

  const showPermissionNotification = useCallback(async (type, tripId) => {
    let title = "";
    let body = "";
    
    switch (type) {
      case 'locationServices':
        title = "Location Services Required";
        body = "Please enable location services in your device settings to start trip tracking.";
        break;
      case 'foregroundPermission':
        title = "Location Permission Required";
        body = "Please grant location permission in app settings to track your trip.";
        break;
      case 'backgroundPermission':
        title = "Background Location Required";
        body = "Please select 'Allow all the time' for location permission in app settings.";
        break;
      default:
        return;
    }

    try {
      console.log('[LocationTracking] Showing permission notification:', type);
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            action: "PERMISSION_REQUIRED", 
            tripId,
            permissionType: type
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error(`[LocationTracking] Failed to show ${type} notification:`, error);
    }
  }, []);

  const checkPermissions = useCallback(async (tripId = null, showNotifications = false) => {
    console.log('[LocationTracking] Checking location permissions for trip:', tripId, 'Show notifications:', showNotifications);
    
    try {
      // 1. Check if location services are enabled on the device
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        console.error('[LocationTracking] Location services are disabled.');
        updateState({ locationServicesDisabled: true });
        
        if (showNotifications && tripId) {
          await showPermissionNotification('locationServices', tripId);
        }
        return false;
      }

      // 2. Check foreground permissions
      let { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      console.log('[LocationTracking] Current foreground status:', foregroundStatus);
      
      // Only request if not determined to avoid multiple prompts
      if (foregroundStatus === "undetermined") {
        console.log('[LocationTracking] Requesting foreground permission...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        foregroundStatus = status;
        console.log('[LocationTracking] Foreground permission request result:', foregroundStatus);
      }
      
      if (foregroundStatus !== "granted") {
        console.error('[LocationTracking] Foreground permission denied.');
        updateState({ permissionDenied: true });
        
        if (showNotifications && tripId) {
          await showPermissionNotification('foregroundPermission', tripId);
        }
        return false;
      }
      console.log('[LocationTracking] Foreground permission granted.');

      // 3. Check background permissions
      let { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      console.log('[LocationTracking] Current background status:', backgroundStatus);
      
      // Only request if not determined to avoid multiple prompts
      if (backgroundStatus === "undetermined") {
        console.log('[LocationTracking] Requesting background permission...');
        const { status } = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = status;
        console.log('[LocationTracking] Background permission request result:', backgroundStatus);
      }
      
      if (backgroundStatus !== "granted") {
        console.error('[LocationTracking] Background permission denied.');
        updateState({ needsBackgroundPermission: true });
        
        if (showNotifications && tripId) {
          await showPermissionNotification('backgroundPermission', tripId);
        }
        return false;
      }
      console.log('[LocationTracking] Background permission granted.');

      // Clear any permission-related states if all permissions are granted
      updateState({ 
        permissionDenied: false, 
        locationServicesDisabled: false, 
        needsBackgroundPermission: false 
      });

      return true;
    } catch (error) {
      console.error('[LocationTracking] Error checking permissions:', error);
      updateState({ error: 'Failed to check permissions' });
      return false;
    }
  }, [updateState, showPermissionNotification]);

  const startTracking = useCallback(async (tripId) => {
    console.log(`[LocationTracking] 🚀 Starting tracking request for trip: ${tripId}, App State: ${AppState.currentState}`);
    
    updateState({ isLoading: true, error: null });
    
    try {
      // Check permissions with notification fallback for background scenarios
      const hasPermissions = await checkPermissions(tripId, AppState.currentState !== 'active');
      if (!hasPermissions) {
        console.error('[LocationTracking] ❌ Cannot start tracking due to missing permissions.');
        updateState({ isLoading: false });
        return false;
      }

      // Check if already tracking
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationTracking] Task already running check:', isTaskRunning);
      
      if (isTaskRunning) {
        console.log('[LocationTracking] ⚠️ Task already running. Stopping before restarting to ensure fresh state.');
        try {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log('[LocationTracking] Successfully stopped existing task');
        } catch (stopError) {
          console.error('[LocationTracking] Error stopping existing task:', stopError);
        }
        // Small delay to ensure clean state
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`[LocationTracking] 📡 Starting background location task for trip: ${tripId}`);
      
      const locationOptions = {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 600000, 
        distanceInterval: 50, // 50 meters
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "Live Location Active",
          notificationBody: `Sharing your location for the current trip.`,
          notificationColor: "#3B82F6",
        },
      };
      
      console.log('[LocationTracking] Location options:', locationOptions);
      
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, locationOptions);
      
      isTrackingRef.current = true;
      updateState({ isLoading: false, trackingActive: true, error: null });
      console.log('[LocationTracking] ✅ Task started successfully.');
      return true;
      
    } catch (error) {
      console.error('[LocationTracking] 💥 Failed to start location task:', error);
      isTrackingRef.current = false;
      
      let errorMessage = "Failed to start location tracking.";
      let shouldNotify = false;
      
      if (error.message?.includes('foreground service cannot be started when the application is in the background')) {
        errorMessage = "App needs to be in foreground to start location tracking.";
        shouldNotify = true;
        
        console.log('[LocationTracking] 📱 Foreground service error - showing notification');
        
        // Show notification to bring app to foreground
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Location Tracking Failed",
              body: "Please open the app to start location tracking for your trip.",
              data: { 
                action: "BRING_TO_FOREGROUND_ERROR", 
                tripId,
                error: "foreground_required"
              },
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
          });
        } catch (notifError) {
          console.error('[LocationTracking] Failed to show foreground required notification:', notifError);
        }
      } else if (error.message?.includes('permission')) {
        errorMessage = "Location permission was revoked. Please check app settings.";
        shouldNotify = true;
        
        console.log('[LocationTracking] 🔒 Permission error - rechecking permissions');
        
        // Re-check permissions to update state
        await checkPermissions(tripId, true);
      } else if (error.message?.includes('location service')) {
        errorMessage = "Location services are disabled. Please enable location services.";
        shouldNotify = true;
        console.log('[LocationTracking] 📍 Location service error');
      }
      
      updateState({ 
        isLoading: false, 
        error: errorMessage,
        trackingActive: false
      });
      
      console.error(`[LocationTracking] ❌ ${errorMessage}`);
      return false;
    }
  }, [updateState, checkPermissions]);

  const stopTracking = useCallback(async () => {
    console.log('[LocationTracking] 🛑 Attempting to stop location task.');
    updateState({ isLoading: true });
    
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationTracking] Task running status before stop:', isTaskRunning);
      
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('[LocationTracking] ✅ Task stopped successfully.');
      } else {
        console.log('[LocationTracking] ℹ️ No running task to stop.');
      }
      
      isTrackingRef.current = false;
      updateState({ isLoading: false, trackingActive: false, error: null });
      return true;
      
    } catch (error) {
      console.error('[LocationTracking] 💥 Failed to stop location task:', error);
      isTrackingRef.current = false; // Force update even if stop failed
      updateState({ 
        isLoading: false, 
        error: "Failed to stop location tracking.",
        trackingActive: false
      });
      return false;
    }
  }, [updateState]);

  const isTracking = useCallback(() => {
    const tracking = isTrackingRef.current;
    console.log('[LocationTracking] Current tracking status:', tracking);
    return tracking;
  }, []);

  // Method to handle permission-related notifications when tapped
  const handlePermissionNotification = useCallback(async (permissionType) => {
    console.log('[LocationTracking] Handling permission notification:', permissionType);
    try {
      await Linking.openSettings();
      
      // Reset relevant states after opening settings
      setTimeout(() => {
        console.log('[LocationTracking] Resetting states after settings opened');
        updateState({ 
          permissionDenied: false, 
          locationServicesDisabled: false,
          needsBackgroundPermission: false,
          error: null
        });
      }, 3000); // Give user time to change settings
    } catch (error) {
      console.error('[LocationTracking] Failed to open settings:', error);
    }
  }, [updateState]);

  // Method to check current tracking status without starting
  const getTrackingStatus = useCallback(async () => {
    console.log('[LocationTracking] Getting tracking status...');
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      const hasPermissions = await checkPermissions();
      
      const status = {
        isRunning: isTaskRunning,
        hasPermissions,
        trackingState
      };
      
      console.log('[LocationTracking] Current status:', status);
      return status;
    } catch (error) {
      console.error('[LocationTracking] Failed to get tracking status:', error);
      return {
        isRunning: false,
        hasPermissions: false,
        trackingState
      };
    }
  }, [checkPermissions, trackingState]);

  // Force sync tracking state with actual task status
  const syncTrackingState = useCallback(async () => {
    console.log('[LocationTracking] Syncing tracking state...');
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('[LocationTracking] Actual task running status:', isTaskRunning);
      
      if (isTrackingRef.current !== isTaskRunning) {
        console.log('[LocationTracking] State mismatch detected - updating');
        isTrackingRef.current = isTaskRunning;
        updateState({ trackingActive: isTaskRunning });
      }
      
      return isTaskRunning;
    } catch (error) {
      console.error('[LocationTracking] Error syncing tracking state:', error);
      return false;
    }
  }, [updateState]);

  return { 
    startTracking, 
    stopTracking, 
    isTracking,
    trackingState,
    resetState,
    handlePermissionNotification,
    getTrackingStatus,
    checkPermissions,
    syncTrackingState
  };
};