import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet, StatusBar } from "react-native";
import { Feather, FontAwesome6, FontAwesome5 } from "@expo/vector-icons";
import MapViewComponent from "./MapViewComponent";
import { LinearGradient } from "expo-linear-gradient";

const LiveTrack = ({ driverLocation, mineLocation, deliveryLocation, milestoneHistory = [] }) => {
  const [isMapVisible, setMapVisible] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient colors={["#059669", "#047857"]} style={styles.gradient}>
              <FontAwesome6 name="map-location-dot" size={18} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Live Tracking</Text>
            <Text style={styles.subtitle}>Real-time shipment monitoring</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.statusDot} />
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>ACTIVE</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <FontAwesome5 name="truck" size={14} color="#059669" />
              </View>
              <Text style={styles.infoTitle}>Track Your Shipment</Text>
            </View>
            <Text style={styles.infoDescription}>Monitor your driver's real-time location, route progress, and estimated arrival times on an interactive map.</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={() => setMapVisible(true)} style={styles.trackButton}>
            <FontAwesome6 name="map-location-dot" size={16} color="white" />
            <Text style={styles.trackButtonText}>Open Live Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="slide" transparent={false} visible={isMapVisible} onRequestClose={() => setMapVisible(false)} statusBarTranslucent={true}>
        <StatusBar backgroundColor="transparent" barStyle="dark-content" translucent />
        <View style={styles.fullScreenContainer}>
          <LinearGradient colors={["rgba(255,255,255,0.95)", "rgba(255,255,255,0.85)"]} style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <FontAwesome6 name="map-location-dot" size={16} color="#059669" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Live Tracking</Text>
                <Text style={styles.modalSubtitle}>Real-time location</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.enhancedCloseButton} onPress={() => setMapVisible(false)}>
              <LinearGradient colors={["#f8fafc", "#ffffff"]} style={styles.closeButtonGradient}>
                <Feather name="x" size={20} color="#374151" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.mapWrapper}>
            <MapViewComponent driverLocation={driverLocation} mineLocation={mineLocation} deliveryLocation={deliveryLocation} milestoneHistory={milestoneHistory} />
          </View>

          <View style={styles.bottomSafeArea} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    marginRight: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#15803D",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  infoCard: {
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    backgroundColor: "#BBF7D0",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#14532D",
  },
  infoDescription: {
    fontSize: 14,
    color: "#15803D",
    lineHeight: 20,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#059669",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: StatusBar.currentHeight + 16 || 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 1,
  },
  enhancedCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  closeButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  mapWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  bottomSafeArea: {
    height: 20,
    backgroundColor: "transparent",
  },
});

export default LiveTrack;
