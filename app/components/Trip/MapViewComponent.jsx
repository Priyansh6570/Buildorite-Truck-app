import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, ActivityIndicator, Animated } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { FontAwesome6, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Enhanced map style for better visual appeal
const professionalMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff", weight: 2 }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#c6f6d5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#38a169" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e8f0", weight: 1 }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#4a5568" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fed7d7" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#2d3748" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e2e8f0" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#edf2f7" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bee3f8" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#2b6cb0" }] },
];

// Enhanced custom marker with animations
const CustomMarker = ({ type, isActive = false }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (type === 'driver' || isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [type, isActive, pulseAnim]);

  const getMarkerConfig = () => {
    switch (type) {
      case 'driver':
        return {
          icon: <FontAwesome6 name="truck" size={22} color="white" />,
          gradientColors: ['#1e40af', '#3b82f6'],
          size: 50,
          shadowColor: '#3b82f6',
          pulseColor: 'rgba(59, 130, 246, 0.3)',
        };
      case 'pickup':
        return {
          icon: <FontAwesome6 name="industry" size={20} color="white" />,
          gradientColors: ['#dc2626', '#f87171'],
          size: 44,
          shadowColor: '#dc2626',
          pulseColor: 'rgba(220, 38, 38, 0.3)',
        };
      case 'delivery':
        return {
          icon: <FontAwesome6 name="flag-checkered" size={20} color="white" />,
          gradientColors: ['#059669', '#10b981'],
          size: 44,
          shadowColor: '#059669',
          pulseColor: 'rgba(5, 150, 105, 0.3)',
        };
      default:
        return {
          icon: null,
          gradientColors: ['#6b7280', '#9ca3af'],
          size: 40,
          shadowColor: '#6b7280',
          pulseColor: 'rgba(107, 114, 128, 0.3)',
        };
    }
  };

  const config = getMarkerConfig();

  return (
    <View style={styles.markerContainer}>
      {/* Pulse Ring for Driver */}
      {type === 'driver' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: config.size + 20,
              height: config.size + 20,
              borderRadius: (config.size + 20) / 2,
              // backgroundColor: config.pulseColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      
      {/* Main Marker */}
      <View
        style={[
          styles.markerBase,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            shadowColor: config.shadowColor,
          },
        ]}
      >
        <LinearGradient
          colors={config.gradientColors}
          style={[
            styles.markerGradient,
            {
              width: config.size,
              height: config.size,
              borderRadius: config.size / 2,
            },
          ]}
        >
          {config.icon}
        </LinearGradient>
      </View>
      
      {/* Location Pin Shadow */}
      <View style={styles.markerShadow} />
    </View>
  );
};

// Enhanced Loading Component
const LoadingView = () => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingCard}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Loading Map...</Text>
      <Text style={styles.loadingSubText}>Preparing route information</Text>
    </View>
  </View>
);

// Route Info Display Component
const RouteInfo = ({ distance, duration, isVisible }) => {
  if (!isVisible || !distance || !duration) return null;

  return (
    <View style={styles.routeInfoContainer}>
      <LinearGradient colors={['#ffffff', '#f8fafc']} style={styles.routeInfoCard}>
        <View style={styles.routeInfoHeader}>
          <FontAwesome5 name="route" size={16} color="#3b82f6" />
          <Text style={styles.routeInfoTitle}>Route Information</Text>
        </View>
        <View style={styles.routeInfoStats}>
          <View style={styles.routeInfoStat}>
            <FontAwesome5 name="road" size={12} color="#6b7280" />
            <Text style={styles.routeInfoValue}>{distance}</Text>
            <Text style={styles.routeInfoLabel}>Distance</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoStat}>
            <FontAwesome5 name="clock" size={12} color="#6b7280" />
            <Text style={styles.routeInfoValue}>{duration}</Text>
            <Text style={styles.routeInfoLabel}>Duration</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const MapViewComponent = ({ driverLocation, mineLocation, deliveryLocation, milestoneHistory = [] }) => {
  const mapRef = useRef(null);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  
  if (!mineLocation?.coordinates || !deliveryLocation?.coordinates) {
    console.warn("MapViewComponent is waiting for location data (mine or delivery).");
    return <LoadingView />;
  }

  const origin = driverLocation?.coordinates 
    ? { latitude: driverLocation.coordinates[1], longitude: driverLocation.coordinates[0] }
    : { latitude: mineLocation.coordinates[1], longitude: mineLocation.coordinates[0] };
    
  const destination = useMemo(() => {
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

    const enRouteToDeliveryStatuses = [
      'en_route_to_delivery',
      'arrived_at_delivery', 
      'delivery_complete'
    ];

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
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [origin.latitude, origin.longitude, destination.latitude, destination.longitude]);

  const handleDirectionsReady = (result) => {
    setRouteInfo({
      distance: result.distance.toFixed(1) + ' km',
      duration: Math.ceil(result.duration) + ' min'
    });
    setShowRouteInfo(true);
    
    mapRef.current.fitToCoordinates(result.coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
    });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={'google'}
        customMapStyle={professionalMapStyle}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        toolbarEnabled={false}
      >
        {/* Enhanced Route with Gradient Effect */}
        <MapViewDirections
          origin={origin}
          destination={destination}
          mode="DRIVING"
          apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY}
          strokeWidth={6}
          strokeColor="#3b82f6"
          onReady={handleDirectionsReady}
          optimizeWaypoints={true}
          precision="high"
          timePrecision="now"
        />

        {/* Driver Marker - Always animated */}
        <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }}>
          <CustomMarker type="driver" isActive={true} />
        </Marker>

        {/* Mine/Pickup Marker */}
        <Marker 
          coordinate={{
            latitude: mineLocation.coordinates[1], 
            longitude: mineLocation.coordinates[0]
          }} 
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <CustomMarker type="pickup" />
        </Marker>

        {/* Delivery Marker */}
        <Marker 
          coordinate={{
            latitude: deliveryLocation.coordinates[1], 
            longitude: deliveryLocation.coordinates[0]
          }} 
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <CustomMarker type="delivery" />
        </Marker>
      </MapView>
      
      {/* Route Information Overlay */}
      <RouteInfo 
        distance={routeInfo.distance} 
        duration={routeInfo.duration} 
        isVisible={showRouteInfo} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    opacity: 0.6,
  },
  markerBase: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  markerGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  markerShadow: {
    position: 'absolute',
    bottom: -2,
    width: 20,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    transform: [{ scaleX: 0.8 }],
  },
  routeInfoContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  routeInfoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  routeInfoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoStat: {
    flex: 1,
    alignItems: 'center',
  },
  routeInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  routeInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
});

export default MapViewComponent;