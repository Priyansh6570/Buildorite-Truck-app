import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';

export const useLocationPermissionMonitor = () => {
  const { user } = useAuthStore();
  const permissionCheckInterval = useRef(null);
  const lastPermissionState = useRef(null);
  const lastLocationServiceState = useRef(null);
  const isMonitoringRef = useRef(false);
  
  const [modalState, setModalState] = useState({
    visible: false,
    type: null
  });

  const shouldMonitor = useCallback(() => {
    const should = user?.role === 'driver' && user?.email;
    // console.log('[PermissionMonitor] Should monitor:', should, 'User role:', user?.role, 'Has email:', !!user?.email);
    return should;
  }, [user]);

  const showPermissionModal = useCallback((type) => {
    // console.log('[PermissionMonitor] Showing modal for type:', type);
    setModalState({ visible: true, type });
  }, []);

  const hidePermissionModal = useCallback(() => {
    // console.log('[PermissionMonitor] Hiding permission modal');
    setModalState({ visible: false, type: null });
  }, []);

  const checkCurrentStatus = useCallback(async () => {
    if (!shouldMonitor()) {
      // console.log('[PermissionMonitor] Not monitoring - user not eligible');
      return { 
        foregroundGranted: true, 
        backgroundGranted: true, 
        locationServicesEnabled: true 
      };
    }

    try {
      // console.log('[PermissionMonitor] Checking current status...');
      
      const providerStatus = await Location.getProviderStatusAsync();
      const locationServicesEnabled = providerStatus.locationServicesEnabled;
      // console.log('[PermissionMonitor] Location services enabled:', locationServicesEnabled);

      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      
      const foregroundGranted = foregroundStatus === 'granted';
      const backgroundGranted = backgroundStatus === 'granted';
      
      // console.log('[PermissionMonitor] Permissions - Foreground:', foregroundGranted, 'Background:', backgroundGranted);

      return {
        foregroundGranted,
        backgroundGranted,
        locationServicesEnabled
      };
    } catch (error) {
      // console.error('[PermissionMonitor] Error checking status:', error);
      return { 
        foregroundGranted: false, 
        backgroundGranted: false, 
        locationServicesEnabled: false 
      };
    }
  }, [shouldMonitor]);

  const handlePermissionChange = useCallback(async () => {
    const currentStatus = await checkCurrentStatus();
    
    if (!shouldMonitor()) {
      // console.log('[PermissionMonitor] Not monitoring, skipping permission change handler');
      return;
    }

    const appState = AppState.currentState;
    // console.log('[PermissionMonitor] Handling permission change, app state:', appState);
    
    if (!currentStatus.locationServicesEnabled) {
      if (lastLocationServiceState.current !== false) {
        // console.log('[PermissionMonitor] Location services disabled - showing modal');
        lastLocationServiceState.current = false;
        
        if (appState === 'active') {
          showPermissionModal('location_off');
        }
      }
      return;
    } else {
      lastLocationServiceState.current = true;
    }

    if (!currentStatus.foregroundGranted) {
      if (lastPermissionState.current?.foreground !== false) {
        // console.log('[PermissionMonitor] Foreground permission denied - showing modal');
        lastPermissionState.current = { 
          ...lastPermissionState.current, 
          foreground: false 
        };
        
        if (appState === 'active') {
          showPermissionModal('permission_denied');
        }
      }
      return;
    }

    if (!currentStatus.backgroundGranted) {
      if (lastPermissionState.current?.background !== false) {
        // console.log('[PermissionMonitor] Background permission denied - showing modal');
        lastPermissionState.current = { 
          ...lastPermissionState.current, 
          background: false 
        };
        
        if (appState === 'active') {
          showPermissionModal('background_permission');
        }
      }
      return;
    }

    if (lastPermissionState.current?.foreground === false || 
        lastPermissionState.current?.background === false ||
        lastLocationServiceState.current === false) {
      // console.log('[PermissionMonitor] All permissions granted - hiding modal');
      lastPermissionState.current = { 
        foreground: true, 
        background: true 
      };
      lastLocationServiceState.current = true;
      hidePermissionModal();
    }
  }, [shouldMonitor, showPermissionModal, hidePermissionModal]);

  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current || !shouldMonitor()) {
      // console.log('[PermissionMonitor] Not starting monitoring - already monitoring or not eligible');
      return;
    }

    // console.log('[PermissionMonitor] Starting location permission monitoring');
    isMonitoringRef.current = true;

    handlePermissionChange();

    permissionCheckInterval.current = setInterval(() => {
      handlePermissionChange();
    }, 3000);

    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      // console.log('[PermissionMonitor] App state changed:', nextAppState);
      if (nextAppState === 'active') {
        setTimeout(handlePermissionChange, 500);
      }
    });

    return () => {
      // console.log('[PermissionMonitor] Cleaning up app state subscription');
      appStateSubscription?.remove();
    };
  }, [shouldMonitor, handlePermissionChange]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoringRef.current) {
      // console.log('[PermissionMonitor] Already not monitoring');
      return;
    }

    // console.log('[PermissionMonitor] Stopping location permission monitoring');
    isMonitoringRef.current = false;

    if (permissionCheckInterval.current) {
      clearInterval(permissionCheckInterval.current);
      permissionCheckInterval.current = null;
    }

    hidePermissionModal();
  }, [hidePermissionModal]);

  useEffect(() => {
    // console.log('[PermissionMonitor] User state changed, should monitor:', shouldMonitor());
    
    if (shouldMonitor()) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      // console.log('[PermissionMonitor] Cleanup - stopping monitoring');
      stopMonitoring();
    };
  }, [shouldMonitor, startMonitoring, stopMonitoring]);

  return {
    checkCurrentStatus,
    startMonitoring,
    stopMonitoring,
    isMonitoring: isMonitoringRef.current,
    modalState,
    hidePermissionModal,
    handlePermissionGranted: () => {
      // console.log('[PermissionMonitor] Permission granted callback triggered');
      hidePermissionModal();
      setTimeout(handlePermissionChange, 1000);
    }
  };
};