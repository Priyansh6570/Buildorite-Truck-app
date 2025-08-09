import React, { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Linking, Modal } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFetchTripById, useUpdateMilestone } from "../../hooks/useTrip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";

const DetailRow = ({ icon, label, value, children }) => (
  <View>
    
    <Text className="text-sm font-semibold text-gray-500">{label}</Text>
    <View className="flex-row items-center mt-2">
      
      <FontAwesome6 name={icon} size={16} color="#4B5563" style={{ width: 24 }} />
      <View className="flex-1 ml-4">
        
        {value && <Text className="text-base font-bold text-gray-800">{value}</Text>} {children}
      </View>
    </View>
  </View>
);
const GetDirectionsButton = ({ destinationLocation, buttonText }) => {
  const openDirections = async () => {
    if (!destinationLocation?.coordinates) {
      Toast.show({ type: "error", text1: "Destination data is missing." });
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Location Permission Denied" });
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude: startLat, longitude: startLng } = currentLocation.coords;
      const [endLng, endLat] = destinationLocation.coordinates;
      const url = Platform.select({ ios: `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${endLat},${endLng}&dirflg=d`, android: `google.navigation:q=${endLat},${endLng}&mode=d` });
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else await Linking.openURL(fallbackUrl);
    } catch (error) {
      console.error("Error opening directions:", error);
      Toast.show({ type: "error", text1: "Could not open maps." });
    }
  };
  return (
    <TouchableOpacity onPress={openDirections} className="flex-row items-center justify-center w-full py-4 mt-4 bg-gray-800 rounded-2xl">
      
      <FontAwesome6 name="location-arrow" size={16} color="white" /> <Text className="ml-3 text-lg font-bold text-white">{buttonText}</Text>
    </TouchableOpacity>
  );
};
const Milestone = ({ status, label, timestamp, isCompleted, isCurrent, isLast }) => {
  return (
    <View className="flex-row">
      
      <View className="items-center w-8">
        
        <View className={`w-6 h-6 rounded-full items-center justify-center ${isCurrent ? "bg-blue-500" : isCompleted ? "bg-green-500" : "bg-gray-300"}`}>
          
          {isCompleted && !isCurrent && <Feather name="check" size={14} color="white" />} {isCurrent && <View className="w-2 h-2 bg-white rounded-full" />}
        </View>
        {!isLast && <View className={`flex-1 w-0.5 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />}
      </View>
      <View className="flex-1 pb-8 ml-4">
        
        <Text className={`text-base font-bold ${isCompleted || isCurrent ? "text-gray-800" : "text-gray-500"}`}>{label}</Text> {isCompleted && timestamp && <Text className="mt-1 text-sm text-gray-500">{format(new Date(timestamp), "MMM d, h:mm a")}</Text>}
      </View>
    </View>
  );
};

// --- Main Screen ---
const TripDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;

  const { data: trip, isLoading, isError, refetch } = useFetchTripById(tripId);
  const { mutate: updateMilestone, isLoading: isUpdating } = useUpdateMilestone();

  const [isModalVisible, setModalVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { currentMilestone, nextAction, allMilestones } = useMemo(() => {
    if (!trip) return { currentMilestone: null, nextAction: null, allMilestones: [] };

    const history = trip.milestone_history.map((m) => m.status);
    const lastMilestone = history.length > 0 ? history[history.length - 1] : null;

    const milestones = [
      { id: "trip_started", label: "Start Trip", requires: "trip_assigned" },
      { id: "arrived_at_pickup", label: "Arrived at Pickup", requires: "trip_started" },
      { id: "loading_complete", label: "Confirm Loading", requires: "arrived_at_pickup" },
      { id: "en_route_to_delivery", label: "Start Delivery", requires: "pickup_verified" },
      { id: "arrived_at_delivery", label: "Arrived at Delivery", requires: "en_route_to_delivery" },
      { id: "delivery_complete", label: "Confirm Delivery", requires: "arrived_at_delivery" },
    ];

    let nextAction = null;
    for (const m of milestones) {
      if (history.includes(m.id)) continue;
      if (history.includes(m.requires)) {
        nextAction = m;
        break;
      }
    }

    if (lastMilestone === "loading_complete" && !history.includes("pickup_verified")) {
      nextAction = { id: "pickup_verified", label: "Waiting for Mine Owner Verification", disabled: true };
    }
    if (lastMilestone === "delivery_complete" && !history.includes("delivery_verified")) {
      nextAction = { id: "delivery_verified", label: "Waiting for Buyer Verification", disabled: true };
    }
    if (trip.status === "completed") {
      nextAction = { id: "completed", label: "Trip Completed", disabled: true };
    }

    const fullMilestoneList = [
      { id: "trip_started", label: "Trip Started" },
      { id: "arrived_at_pickup", label: "Arrived at Pickup Location" },
      { id: "loading_complete", label: "Loading Complete" },
      { id: "pickup_verified", label: "Pickup Verified by Mine Owner" },
      { id: "en_route_to_delivery", label: "En Route to Delivery" },
      { id: "arrived_at_delivery", label: "Arrived at Delivery Location" },
      { id: "delivery_complete", label: "Delivery Complete" },
      { id: "delivery_verified", label: "Delivery Verified by Buyer" },
    ];

    const populatedMilestones = fullMilestoneList.map((m) => {
      const historyEntry = trip.milestone_history.find((h) => h.status === m.id);
      return { ...m, isCompleted: !!historyEntry, timestamp: historyEntry?.timestamp, isCurrent: lastMilestone === m.id };
    });

    return { currentMilestone: lastMilestone, nextAction, allMilestones: populatedMilestones };
  }, [trip]);

  const handleUpdateMilestone = async () => {
    if (!isConfirmed || !nextAction || nextAction.disabled) return;

    updateMilestone(
      { tripId, status: nextAction.id },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Milestone Updated!" });
          refetch();
        },
        onError: (err) =>
          Toast.show({
            type: "error",
            text1: "Update Failed",
            text2: err.message,
          }),
        onSettled: () => {
          setModalVisible(false);
          setIsConfirmed(false);
        },
      }
    );
  };

  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1f2937" />
      </View>
    );
  if (isError || !trip)
    return (
      <View style={styles.container}>
        <Text>Could not load trip details.</Text>
      </View>
    );

  const agreement = trip.request_id.finalized_agreement;
  const mineLocation = trip.request_id.mine_id.location;
  const deliveryLocation = trip.destination;
  const showDirectionsToMine = !currentMilestone || ["trip_started", "arrived_at_pickup"].includes(currentMilestone);

  return (
    <View style={styles.flexOne}>
      <View style={{ paddingTop: insets.top, ...styles.header }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
          {trip.request_id.material_id.name}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.card}>
          <Text className="text-lg font-bold text-gray-800">Next Step</Text>
          <Text className="mt-1 text-3xl font-bold text-blue-600">{nextAction?.label || "..."}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} disabled={!nextAction || nextAction.disabled || isUpdating} className={`flex-row items-center justify-center w-full py-4 mt-6 rounded-2xl ${!nextAction || nextAction.disabled ? "bg-gray-300" : "bg-gray-800"}`}>
            {isUpdating ? <ActivityIndicator color="white" /> : <Feather name="check-circle" size={18} color="white" />}
            <Text className="ml-3 text-lg font-bold text-white">{nextAction?.disabled ? nextAction.label : "Update Status"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <DetailRow icon="calendar-alt" label="Schedule" value={format(new Date(agreement.schedule.date), "eee, MMM d, yyyy 'at' h:mm a")} />
          <View style={styles.separator} />
          <DetailRow icon="truck-pickup" label="Pickup From" value={trip.request_id.mine_id.name} />
          <View style={styles.separator} />
          <DetailRow icon="map-marker-alt" label="Deliver To" value={deliveryLocation.address} />
          <View style={styles.separator} />
          <DetailRow icon="truck" label="Vehicle" value={`${trip.truck_id.name} (${trip.truck_id.registration_number})`} />
          <GetDirectionsButton destinationLocation={showDirectionsToMine ? mineLocation : deliveryLocation} buttonText={showDirectionsToMine ? "Directions to Mine" : "Directions to Delivery"} />
        </View>

        <View style={styles.card}>
          <Text className="mb-6 text-xl font-bold text-gray-900">Trip Timeline</Text>
          {allMilestones.map((m, index) => (
            <Milestone key={m.id} {...m} isLast={index === allMilestones.length - 1} />
          ))}
        </View>
      </ScrollView>

      <Modal transparent={true} visible={isModalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Action</Text>
            <Text style={styles.modalText}>You are about to update the status to:</Text>
            <Text style={styles.modalStatus}>{nextAction?.label}</Text>

            <TouchableOpacity onPress={() => setIsConfirmed(!isConfirmed)} className="flex-row items-center p-3 my-6 bg-gray-100 rounded-lg">
              <View className={`w-6 h-6 border-2 rounded ${isConfirmed ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"}`}>{isConfirmed && <Feather name="check" size={16} color="white" />}</View>
              <Text className="flex-1 ml-3 text-base text-gray-700">I confirm I have completed this step.</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleUpdateMilestone} disabled={!isConfirmed || isUpdating} className={`w-full py-4 rounded-2xl ${!isConfirmed || isUpdating ? "bg-gray-300" : "bg-gray-800"}`}>
              {isUpdating ? <ActivityIndicator color="white" /> : <Text className="text-lg font-bold text-center text-white">Confirm</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} className="w-full py-4 mt-3">
              <Text className="text-base font-bold text-center text-gray-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "white", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  scrollView: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: "white", borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalContainer: { width: "100%", backgroundColor: "white", borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#1F2937" },
  modalText: { fontSize: 16, textAlign: "center", color: "#6B7280", marginTop: 8 },
  modalStatus: { fontSize: 18, fontWeight: "bold", textAlign: "center", color: "#3B82F6", marginTop: 4 },
});

export default TripDetailScreen;