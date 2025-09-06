import React, { useEffect } from "react";
import { useLocationPermissionMonitor } from "../../hooks/useLocationPermissionMonitor";
import LocationPermissionModal from "../modals/LocationPermissionModal";

const LocationPermissionSetup = () => {
  const { isMonitoring, modalState, handlePermissionGranted } = useLocationPermissionMonitor();

  useEffect(() => {
    console.log("[LocationPermissionSetup] Component mounted");
    console.log("[LocationPermissionSetup] Monitoring status:", isMonitoring);
    console.log("[LocationPermissionSetup] Modal state:", modalState);
  }, [isMonitoring, modalState]);

  return (
    <>
      <LocationPermissionModal visible={modalState.visible} permissionType={modalState.type} onPermissionGranted={handlePermissionGranted} />
    </>
  );
};

export default LocationPermissionSetup;
