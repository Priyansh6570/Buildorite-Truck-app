import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const LocationPermissionModal = ({ visible, onClose, onEnableLocation, onOpenSettings, type = "location_services" }) => {
  const getContent = () => {
    switch (type) {
      case "location_services":
        return {
          icon: "map-pin",
          iconColor: "#EF4444",
          title: "Location Services Required",
          description: "Enable location services to share your location during trips and help customers track their deliveries.",
          primaryButton: "Turn On Location",
          primaryAction: onEnableLocation,
        };
      case "foreground_permission":
        return {
          icon: "navigation",
          iconColor: "#3B82F6",
          title: "Location Access Needed",
          description: "Grant location permission to track your position during trips. This helps customers know when their delivery is arriving.",
          primaryButton: "Grant Permission",
          primaryAction: onEnableLocation,
        };
      case "background_permission":
        return {
          icon: "shield",
          iconColor: "#10B981",
          title: "Background Location Required",
          description: "Allow location access even when the app is closed. This ensures continuous tracking during deliveries for better customer service.",
          primaryButton: "Allow Always",
          primaryAction: onEnableLocation,
        };
      case "permission_denied":
        return {
          icon: "alert-triangle",
          iconColor: "#F59E0B",
          title: "Permission Required",
          description: "Location permission is required for this app to work properly. Please enable it in your device settings.",
          primaryButton: "Open Settings",
          primaryAction: onOpenSettings,
        };
      default:
        return {
          icon: "map-pin",
          iconColor: "#6B7280",
          title: "Location Permission",
          description: "Location access is required.",
          primaryButton: "Grant Permission",
          primaryAction: onEnableLocation,
        };
    }
  };

  const content = getContent();

  return (
    <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.iconContainer, { backgroundColor: content.iconColor + "20" }]}>
            <Feather name={content.icon} size={32} color={content.iconColor} />
          </View>

          <Text style={styles.title}>{content.title}</Text>

          <Text style={styles.description}>{content.description}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={content.primaryAction} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>{content.primaryButton}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default LocationPermissionModal;
