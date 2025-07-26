import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export const useLocationStatus = () => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationEnabled(false);
      } else {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        setIsLocationEnabled(servicesEnabled);
      }
    })();
  }, []);

  const requestEnableLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    setIsLocationEnabled(status === 'granted' && servicesEnabled);
  };

  return { isLocationEnabled, requestEnableLocation };
};