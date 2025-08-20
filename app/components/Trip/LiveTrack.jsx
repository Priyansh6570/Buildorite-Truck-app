import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { Feather, FontAwesome6 } from '@expo/vector-icons';
import MapViewComponent from './MapViewComponent';

const { height } = Dimensions.get('window');

const LiveTrack = ({ driverLocation, mineLocation, deliveryLocation, milestoneHistory=[] }) => {
  const [isMapVisible, setMapVisible] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>Track Your Shipment</Text>
        <Text style={styles.subtitle}>Get real-time updates on your driver's location.</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setMapVisible(true)}
          style={styles.trackButton}
        >
          <FontAwesome6 name="map-location-dot" size={18} color="white" />
          <Text style={styles.trackButtonText}>Track Driver</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isMapVisible}
        onRequestClose={() => setMapVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.mapContainer}>
                <MapViewComponent 
                    driverLocation={driverLocation}
                    mineLocation={mineLocation}
                    deliveryLocation={deliveryLocation}
                    milestoneHistory={milestoneHistory}
                />
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setMapVisible(false)}
                >
                    <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 16,
  },
  disabledText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 16,
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapContainer: {
    height: height * 0.6,
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  }
});

export default LiveTrack;