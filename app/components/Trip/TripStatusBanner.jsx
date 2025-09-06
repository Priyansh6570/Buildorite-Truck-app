import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const TripStatusBanner = ({ lastMilestone }) => {
  const getBannerDetails = () => {
    if (!lastMilestone) {
      return {
        icon: "info",
        color: "#6B7280", // Gray
        text: "This trip has been assigned and will start soon.",
        bgColor: "#F3F4F6",
      };
    }

    switch (lastMilestone) {
      case "trip_started":
      case "arrived_at_pickup":
        return {
          icon: "truck",
          color: "#3B82F6", // Blue
          text: "Driver is on the way to the pickup location.",
          bgColor: "#DBEAFE",
        };
      case "loading_complete":
        return {
          icon: "archive",
          color: "#F59E0B", // Amber
          text: "Material loading is complete. Awaiting your verification.",
          bgColor: "#FEF3C7",
        };
      case "pickup_verified":
      case "en_route_to_delivery":
        return {
          icon: "navigation",
          color: "#10B981", // Green
          text: "Shipment is on its way to the delivery location.",
          bgColor: "#D1FAE5",
        };
      case "arrived_at_delivery":
        return {
          icon: "flag",
          color: "#10B981", // Green
          text: "Driver has arrived at the delivery destination.",
          bgColor: "#D1FAE5",
        };
      default:
        return null;
    }
  };

  const bannerDetails = getBannerDetails();

  if (!bannerDetails) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: bannerDetails.bgColor }]}>
      <Feather name={bannerDetails.icon} size={20} color={bannerDetails.color} />
      <Text style={[styles.bannerText, { color: bannerDetails.color }]}>{bannerDetails.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
});

export default TripStatusBanner;
