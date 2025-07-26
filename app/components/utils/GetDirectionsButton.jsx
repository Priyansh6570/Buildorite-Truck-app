import React from 'react';
import { TouchableOpacity, Text, Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const GetDirectionsButton = ({ mineData }) => {
  const openDirections = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Location Permission Denied',
          text2: 'Please enable location permissions to get directions.',
        });
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: currentLat, longitude: currentLng } = currentLocation.coords;
      
      // Extract destination coordinates from mine data
      const [destinationLng, destinationLat] = mineData.location.coordinates;
      
      // Create the maps URL based on platform
      let mapsUrl;
      
      if (Platform.OS === 'ios') {
        // For iOS, use Apple Maps URL scheme
        mapsUrl = `http://maps.apple.com/?saddr=${currentLat},${currentLng}&daddr=${destinationLat},${destinationLng}&dirflg=d`;
        
        // Alternative: Use Google Maps on iOS if preferred
        // mapsUrl = `comgooglemaps://?saddr=${currentLat},${currentLng}&daddr=${destinationLat},${destinationLng}&directionsmode=driving`;
      } else {
        // For Android, use Google Maps
        mapsUrl = `google.navigation:q=${destinationLat},${destinationLng}&mode=d`;
        
        // Alternative: Use web URL that works on both platforms
        // mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      }

      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(mapsUrl);
      
      if (canOpen) {
        await Linking.openURL(mapsUrl);
      } else {
        // Fallback to web URL if native app URL doesn't work
        const webUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
        await Linking.openURL(webUrl);
      }
      
    } catch (error) {
      console.error('Error getting directions:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Unable to get directions. Please try again later.',
      });
    }
  };

  return (
    <TouchableOpacity
      onPress={openDirections}
      style={{
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        shadowColor: '#999',
        elevation: 1,
      }}
      className="flex-row items-center justify-center w-full py-3 bg-[#1E293B] rounded-xl"
    >
      <FontAwesome6 name="location-arrow" size={18} color="#ffffff" solid className="mr-1 " />
      <Text className="ml-2 text-lg font-black text-white">
        Get Directions
      </Text>
    </TouchableOpacity>
  );
};

export default GetDirectionsButton;

// Usage in your mine detail component:
/*
import GetDirectionsButton from './GetDirectionsButton';

// In your mine detail component
<GetDirectionsButton mineData={mineDetailData} />
*/

// Alternative implementation with more options:
export const GetDirectionsWithOptions = ({ mineData }) => {
  const openDirectionsWithChoice = () => {
    Alert.alert(
      'Get Directions',
      'Choose your preferred maps app:',
      [
        {
          text: 'Google Maps',
          onPress: () => openGoogleMaps(),
        },
        {
          text: Platform.OS === 'ios' ? 'Apple Maps' : 'Default Maps',
          onPress: () => openDefaultMaps(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openGoogleMaps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude: currentLat, longitude: currentLng } = currentLocation.coords;
      const [destinationLng, destinationLat] = mineData.location.coordinates;

      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`;
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Google Maps:', error);
    }
  };

  const openDefaultMaps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude: currentLat, longitude: currentLng } = currentLocation.coords;
      const [destinationLng, destinationLat] = mineData.location.coordinates;

      let url;
      if (Platform.OS === 'ios') {
        url = `http://maps.apple.com/?saddr=${currentLat},${currentLng}&daddr=${destinationLat},${destinationLng}&dirflg=d`;
      } else {
        url = `google.navigation:q=${destinationLat},${destinationLng}&mode=d`;
      }

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to web
        await openGoogleMaps();
      }
    } catch (error) {
      console.error('Error opening default maps:', error);
    }
  };

return (
    <TouchableOpacity
      onPress={openDirections}
      className="flex-row items-center justify-center w-full py-3 transition-all duration-300 bg-[#1E293B] rounded-xl"
    >
      <FontAwesome6 name="location-arrow" size={18} color="#ffffff" className="mr-1" />
      <Text className="ml-2 text-base font-black text-white">
        Get Directions
      </Text>
    </TouchableOpacity>
  );
};