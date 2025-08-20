import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Platform, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { FontAwesome6 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

const CustomMarker = ({ type }) => {
  const getMarkerStyle = () => {
    switch (type) {
      case 'driver':
        return {
          icon: <FontAwesome6 name="truck" size={20} color="white" />,
          style: styles.driverMarker,
        };
      case 'pickup':
        return {
          icon: <FontAwesome6 name="warehouse" size={18} color="white" />,
          style: styles.locationMarker,
        };
      case 'delivery':
        return {
          icon: <FontAwesome6 name="flag-checkered" size={18} color="white" />,
          style: [styles.locationMarker, { backgroundColor: '#10B981' }],
        };
      default:
        return {
          icon: null,
          style: {},
        };
    }
  };

  const { icon, style } = getMarkerStyle();
  return <View style={style}>{icon}</View>;
};

const MapViewComponent = ({ driverLocation, mineLocation, deliveryLocation, milestoneHistory = [] }) => {
  console.log("MapViewComponent rendered", driverLocation);
  const mapRef = useRef(null);
  
  if (!mineLocation?.coordinates || !deliveryLocation?.coordinates) {
    console.warn("MapViewComponent is waiting for location data (mine or delivery).");
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1F2937" />
        </View>
    );
  }

  const origin = driverLocation?.coordinates 
    ? { latitude: driverLocation.coordinates[1], longitude: driverLocation.coordinates[0] }
    : { latitude: mineLocation.coordinates[1], longitude: mineLocation.coordinates[0] };
    
  const destination = useMemo(() => {
    // Get the latest milestone status
    const latestMilestone = milestoneHistory.length > 0 
      ? milestoneHistory[milestoneHistory.length - 1] 
      : null;
    
    if (!latestMilestone) {
      console.log("No milestone history found, defaulting to mine location");
      return {
        latitude: mineLocation.coordinates[1],
        longitude: mineLocation.coordinates[0],
      };
    }

    const latestStatus = latestMilestone.status;
    console.log("Latest milestone status:", latestStatus);

    // Check if latest milestone indicates en route to delivery
    const enRouteToDeliveryStatuses = [
      'en_route_to_delivery',
      'arrived_at_delivery', 
      'delivery_complete'
    ];

    // Check if latest milestone indicates en route to mine/pickup
    const enRouteToPickupStatuses = [
      'trip_started',
      'arrived_at_pickup',
      'loading_complete'
    ];

    if (enRouteToDeliveryStatuses.includes(latestStatus)) {
      console.log("Route Destination: Delivery Location");
      return {
        latitude: deliveryLocation.coordinates[1],
        longitude: deliveryLocation.coordinates[0],
      };
    } else if (enRouteToPickupStatuses.includes(latestStatus)) {
      console.log("Route Destination: Mine Location");
      return {
        latitude: mineLocation.coordinates[1],
        longitude: mineLocation.coordinates[0],
      };
    } else {
      // For other statuses like 'trip_assigned', 'pickup_verified', 'delivery_verified'
      // Default to mine location
      console.log("Route Destination: Mine Location (default)");
      return {
        latitude: mineLocation.coordinates[1],
        longitude: mineLocation.coordinates[0],
      };
    }
  }, [milestoneHistory, mineLocation, deliveryLocation]);

  const initialRegion = {
    ...origin,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  useEffect(() => {
    if (mapRef.current && origin && destination) {
        setTimeout(() => {
             mapRef.current.fitToCoordinates([origin, destination], {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                animated: true,
            });
        }, 500);
    }
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={'google'}
      customMapStyle={lightMapStyle}
      initialRegion={initialRegion}
    >
      <MapViewDirections
        origin={origin}
        destination={destination}
        mode="DRIVING"
        apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY}
        strokeWidth={5}
        strokeColor="#3B82F6"
        onReady={result => {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          });
        }}
      />

      <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
        <CustomMarker type="driver" />
      </Marker>
      <Marker coordinate={{latitude: mineLocation.coordinates[1], longitude: mineLocation.coordinates[0]}} anchor={{ x: 0.5, y: 0.5 }}>
        <CustomMarker type="pickup" />
      </Marker>
      <Marker coordinate={{latitude: deliveryLocation.coordinates[1], longitude: deliveryLocation.coordinates[0]}} anchor={{ x: 0.5, y: 0.5 }}>
        <CustomMarker type="delivery" />
      </Marker>
    </MapView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  driverMarker: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'white'
  },
  locationMarker: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'white'
  },
});

export default MapViewComponent;