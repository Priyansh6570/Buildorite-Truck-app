import { useEffect, useRef, useCallback, useState } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { useAuthStore } from "../store/authStore";

export const useLocationPermissionMonitor = () => {
  const { user } = useAuthStore();
  const permissionCheckInterval = useRef(null);
  const lastPermissionState = useRef(null);
  const lastLocationServiceState = useRef(null);
  const isMonitoringRef = useRef(false);

  const [modalState, setModalState] = useState({
    visible: false,
    type: null,
  });

  const shouldMonitor = useCallback(() => {
    const should = user?.role === "driver" && user?.email;
    return should;
  }, [user]);

  const showPermissionModal = useCallback((type) => {
    setModalState({ visible: true, type });
  }, []);

  const hidePermissionModal = useCallback(() => {
    setModalState({ visible: false, type: null });
  }, []);

  const checkCurrentStatus = useCallback(async () => {
    if (!shouldMonitor()) {
      return {
        foregroundGranted: true,
        backgroundGranted: true,
        locationServicesEnabled: true,
      };
    }

    try {
      const providerStatus = await Location.getProviderStatusAsync();
      const locationServicesEnabled = providerStatus.locationServicesEnabled;

      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();

      const foregroundGranted = foregroundStatus === "granted";
      const backgroundGranted = backgroundStatus === "granted";

      return {
        foregroundGranted,
        backgroundGranted,
        locationServicesEnabled,
      };
    } catch (error) {
      return {
        foregroundGranted: false,
        backgroundGranted: false,
        locationServicesEnabled: false,
      };
    }
  }, [shouldMonitor]);

  const handlePermissionChange = useCallback(async () => {
    const currentStatus = await checkCurrentStatus();

    if (!shouldMonitor()) {
      return;
    }

    const appState = AppState.currentState;

    if (!currentStatus.locationServicesEnabled) {
      if (lastLocationServiceState.current !== false) {
        lastLocationServiceState.current = false;

        if (appState === "active") {
          showPermissionModal("location_off");
        }
      }
      return;
    } else {
      lastLocationServiceState.current = true;
    }

    if (!currentStatus.foregroundGranted) {
      if (lastPermissionState.current?.foreground !== false) {
        lastPermissionState.current = {
          ...lastPermissionState.current,
          foreground: false,
        };

        if (appState === "active") {
          showPermissionModal("permission_denied");
        }
      }
      return;
    }

    if (!currentStatus.backgroundGranted) {
      if (lastPermissionState.current?.background !== false) {
        lastPermissionState.current = {
          ...lastPermissionState.current,
          background: false,
        };

        if (appState === "active") {
          showPermissionModal("background_permission");
        }
      }
      return;
    }

    if (lastPermissionState.current?.foreground === false || lastPermissionState.current?.background === false || lastLocationServiceState.current === false) {
      lastPermissionState.current = {
        foreground: true,
        background: true,
      };
      lastLocationServiceState.current = true;
      hidePermissionModal();
    }
  }, [shouldMonitor, showPermissionModal, hidePermissionModal]);

  const startMonitoring = useCallback(() => {
    if (isMonitoringRef.current || !shouldMonitor()) {
      return;
    }

    isMonitoringRef.current = true;

    handlePermissionChange();

    permissionCheckInterval.current = setInterval(() => {
      handlePermissionChange();
    }, 3000);

    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        setTimeout(handlePermissionChange, 500);
      }
    });

    return () => {
      appStateSubscription?.remove();
    };
  }, [shouldMonitor, handlePermissionChange]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoringRef.current) {
      return;
    }

    isMonitoringRef.current = false;

    if (permissionCheckInterval.current) {
      clearInterval(permissionCheckInterval.current);
      permissionCheckInterval.current = null;
    }

    hidePermissionModal();
  }, [hidePermissionModal]);

  useEffect(() => {
    if (shouldMonitor()) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
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
      hidePermissionModal();
      setTimeout(handlePermissionChange, 1000);
    },
  };
};
