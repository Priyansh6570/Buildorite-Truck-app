import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

const LocationPermissionModal = ({ visible, onPermissionGranted, permissionType = 'location_off' }) => {
  console.log('[LocationPermissionModal] Rendered with type:', permissionType);

  const getModalContent = () => {
    switch (permissionType) {
      case 'location_off':
        return {
          icon: 'location-outline',
          title: 'Location Services Disabled',
          subtitle: 'Please enable location services for the app to work correctly',
          buttonText: 'Enable Device Location',
          action: handleEnableLocation
        };
      case 'permission_denied':
        return {
          icon: 'location-outline',
          title: 'Location Permission Not Enabled',
          subtitle: 'Please enable location permission for the app to work correctly',
          buttonText: 'Enable Location Permission',
          action: handleRequestPermission
        };
      case 'background_permission':
        return {
          icon: 'shield-outline',
          title: 'Background Location Required',
          subtitle: 'All-time location permission is required for the app to function correctly',
          buttonText: 'Go to Settings',
          action: handleOpenSettings
        };
      default:
        return {
          icon: 'location-outline',
          title: 'Location Permission Required',
          subtitle: 'Please enable location services for the app to work correctly',
          buttonText: 'Enable Location',
          action: handleRequestPermission
        };
    }
  };

  const handleEnableLocation = async () => {
    console.log('[LocationPermissionModal] Attempting to enable location services');
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('[LocationPermissionModal] No permission, requesting first');
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (newStatus !== 'granted') {
          Alert.alert(
            "Location Permission Required",
            "Location permission is required for the app to function correctly. Please enable it in app settings.",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Go to Settings",
                onPress: () => Linking.openSettings()
              }
            ]
          );
          return;
        }
      }
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        console.log('[LocationPermissionModal] Location services still disabled, trying to get current position to trigger native dialog');
        
        try {
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 15000,
          });
          console.log('[LocationPermissionModal] Location services enabled successfully via native dialog');
          onPermissionGranted();
          
        } catch (locationError) {
          console.log('[LocationPermissionModal] Location request failed, probably still disabled:', locationError);
          
          if (locationError.code === 'E_LOCATION_SERVICES_DISABLED' || 
              locationError.message?.includes('location') || 
              locationError.message?.includes('disabled')) {
            
            const newProviderStatus = await Location.getProviderStatusAsync();
            if (!newProviderStatus.locationServicesEnabled) {
              Alert.alert(
                "Location Services Required",
                "Location services are still disabled. Please enable location services in your device settings to continue.",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  {
                    text: "Open Settings",
                    onPress: () => Linking.openSettings()
                  }
                ]
              );
            } else {
              console.log('[LocationPermissionModal] Location services enabled after retry');
              onPermissionGranted();
            }
          } else {
            Alert.alert("Error", "Failed to access location services. Please try again.");
          }
        }
      } else {
        console.log('[LocationPermissionModal] Location services already enabled');
        onPermissionGranted();
      }
      
    } catch (error) {
      console.error('[LocationPermissionModal] Error enabling location:', error);
      Alert.alert("Error", "Failed to check location services. Please try again.");
    }
  };

  const handleRequestPermission = async () => {
    console.log('[LocationPermissionModal] Requesting location permission');
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus === 'granted') {
        console.log('[LocationPermissionModal] Foreground permission granted, requesting background');
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (backgroundStatus === 'granted') {
          console.log('[LocationPermissionModal] All permissions granted');
          onPermissionGranted();
        } else {
          console.log('[LocationPermissionModal] Background permission denied');
          Alert.alert(
            "Background Location Required",
            "All-time location permission is required for the app to function correctly.",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Go to Settings",
                onPress: () => Linking.openSettings()
              }
            ]
          );
        }
      } else {
        console.log('[LocationPermissionModal] Foreground permission denied');
        Alert.alert(
          "Permission Required",
          "Location permission is required for the app to work. Please enable it in settings.",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Go to Settings",
              onPress: () => Linking.openSettings()
            }
          ]
        );
      }
    } catch (error) {
      console.error('[LocationPermissionModal] Error requesting permission:', error);
      Alert.alert("Error", "Failed to request permission. Please try again.");
    }
  };

  const handleOpenSettings = () => {
    console.log('[LocationPermissionModal] Opening device settings');
    Linking.openSettings();
  };

  const content = getModalContent();

  return (
    <SafeAreaView className="-mb-12">
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
        console.log('[LocationPermissionModal] Back button pressed - blocking close');
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name={content.icon} size={60} color="#FF6B6B" />
          </View>
          
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.subtitle}>{content.subtitle}</Text>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={content.action}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonText}>{content.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LocationPermissionModal;