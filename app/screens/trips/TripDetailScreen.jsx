import React, { useState, useMemo, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Linking, RefreshControl, Platform, TextInput } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFetchTripById, useUpdateMilestone, useReportIssue } from "../../hooks/useTrip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import { LinearGradient } from "expo-linear-gradient";

const TripStatusBanner = ({ lastMilestone }) => {
  const details = useMemo(() => {
    const baseStyle = "flex-row items-center p-4 border rounded-xl shadow-sm";
    const iconContainerBase = "w-12 h-12 rounded-xl items-center justify-center mr-4";

    switch (lastMilestone) {
      case "trip_assigned":
        return {
          style: `${baseStyle} bg-slate-50 border-slate-200`,
          icon: "clipboard-list",
          iconContainer: `${iconContainerBase} bg-slate-600`,
          heading: "Trip Assigned",
          subheading: "Trip scheduled and ready to begin",
          textColor: "text-slate-900",
          subTextColor: "text-slate-600",
          statusDot: "bg-slate-500",
        };
      case "trip_started":
        return {
          style: `${baseStyle} bg-blue-50 border-blue-200`,
          icon: "truck",
          iconContainer: `${iconContainerBase} bg-blue-600`,
          heading: "Trip Started",
          subheading: "You are en route to the pickup location",
          textColor: "text-blue-900",
          subTextColor: "text-blue-700",
          statusDot: "bg-blue-500",
        };
      case "arrived_at_pickup":
        return {
          style: `${baseStyle} bg-orange-50 border-orange-200`,
          icon: "location-dot",
          iconContainer: `${iconContainerBase} bg-orange-600`,
          heading: "Arrived at Pickup",
          subheading: "Ready for material loading",
          textColor: "text-orange-900",
          subTextColor: "text-orange-700",
          statusDot: "bg-orange-500",
        };
      case "loading_complete":
        return {
          style: `${baseStyle} bg-amber-50 border-amber-200`,
          icon: "boxes-stacked",
          iconContainer: `${iconContainerBase} bg-amber-600`,
          heading: "Loading Complete",
          subheading: "Awaiting pickup verification from mine owner",
          textColor: "text-amber-900",
          subTextColor: "text-amber-700",
          statusDot: "bg-amber-500",
        };
      case "pickup_verified":
        return {
          style: `${baseStyle} bg-emerald-50 border-emerald-200`,
          icon: "circle-check",
          iconContainer: `${iconContainerBase} bg-emerald-600`,
          heading: "Pickup Verified",
          subheading: "Shipment confirmed and ready for transport",
          textColor: "text-emerald-900",
          subTextColor: "text-emerald-700",
          statusDot: "bg-emerald-500",
        };
      case "en_route_to_delivery":
        return {
          style: `${baseStyle} bg-blue-50 border-blue-200`,
          icon: "route",
          iconContainer: `${iconContainerBase} bg-blue-700`,
          heading: "En Route to Delivery",
          subheading: "Shipment in transit to destination",
          textColor: "text-blue-900",
          subTextColor: "text-blue-700",
          statusDot: "bg-blue-500",
        };
      case "arrived_at_delivery":
        return {
          style: `${baseStyle} bg-purple-50 border-purple-200`,
          icon: "map-pin",
          iconContainer: `${iconContainerBase} bg-purple-600`,
          heading: "Arrived at Delivery",
          subheading: "You are at the destination, ready to unload",
          textColor: "text-purple-900",
          subTextColor: "text-purple-700",
          statusDot: "bg-purple-500",
        };
      case "delivery_complete":
        return {
          style: `${baseStyle} bg-indigo-50 border-indigo-200`,
          icon: "truck-ramp-box",
          iconContainer: `${iconContainerBase} bg-indigo-600`,
          heading: "Delivery Complete",
          subheading: "Unloading finished, awaiting buyer verification",
          textColor: "text-indigo-900",
          subTextColor: "text-indigo-700",
          statusDot: "bg-indigo-500",
        };
      case "delivery_verified":
        return {
          style: `${baseStyle} bg-green-50 border-green-200`,
          icon: "shield-halved",
          iconContainer: `${iconContainerBase} bg-green-600`,
          heading: "Trip Completed",
          subheading: "Delivery successfully verified and completed",
          textColor: "text-green-900",
          subTextColor: "text-green-700",
          statusDot: "bg-green-500",
        };
      default:
        return null;
    }
  }, [lastMilestone]);

  if (!details) return null;

  return (
    <View className={details.style}>
      <View className="absolute top-3 right-3">
        <View className={`w-3 h-3 rounded-full ${details.statusDot}`} />
      </View>
      <View className={details.iconContainer}>
        <FontAwesome6 name={details.icon} size={18} color="white" solid />
      </View>
      <View className="flex-1">
        <Text className={`text-lg font-bold ${details.textColor}`}>{details.heading}</Text>
        <Text className={`text-sm mt-1 ${details.subTextColor} leading-5`}>{details.subheading}</Text>
      </View>
    </View>
  );
};

const TripCancelBanner = ({ cancelReason }) => {
  return (
    <View className="flex-row items-center p-4 border border-red-200 shadow-sm rounded-xl bg-red-50">
      <View className="absolute top-3 right-3">
        <View className="w-3 h-3 bg-red-500 rounded-full" />
      </View>
      <View className="items-center justify-center w-12 h-12 mr-4 bg-red-600 rounded-xl">
        <FontAwesome6 name="ban" size={18} color="white" solid />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-red-900">Trip Canceled</Text>
        <Text className="mt-1 text-sm leading-5 text-red-700">{cancelReason || "Trip has been canceled"}</Text>
      </View>
    </View>
  );
};

const issueReasons = [
  { label: "Accident", value: "accident" },
  { label: "Vehicle Breakdown", value: "vehicle_breakdown" },
  { label: "Unable to Load", value: "unable_to_load" },
  { label: "Delivery Issue", value: "delivery_issue" },
  { label: "Other", value: "other" },
];

const TripIssueReportedBanner = ({ issue }) => {
  return (
    <View className="flex-row items-center p-4 border border-orange-200 shadow-sm rounded-xl bg-orange-50">
      <View className="absolute top-3 right-3">
        <View className="w-3 h-3 bg-orange-500 rounded-full" />
      </View>
      <View className="items-center justify-center w-12 h-12 mr-4 bg-orange-600 rounded-xl">
        <FontAwesome6 name="triangle-exclamation" size={18} color="white" solid />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-orange-900">
          Issue Reported : <Text className="font-medium text-orange-700">{issueReasons.find((r) => r.value === issue?.reason)?.label}</Text>
        </Text>
        <Text className="mt-1 text-sm leading-5 text-orange-700">{issue?.notes || "An issue has been reported for this trip."}</Text>
      </View>
    </View>
  );
};

const GetDirectionsButton = ({ destinationLocation, buttonText, subText }) => {
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
      const [endLng, endLat] = destinationLocation?.coordinates;
      const url = Platform.select({
        ios: `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${endLat},${endLng}&dirflg=d`,
        android: `google.navigation:q=${endLat},${endLng}&mode=d`,
      });
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
    <View className="bg-white border border-gray-100 shadow-lg rounded-2xl">
      <View className="px-6 py-5 border-b border-gray-100">
        <View className="flex-row items-center">
          <View className="items-center justify-center w-12 h-12 mr-4 overflow-hidden rounded-xl">
            <LinearGradient colors={["#3B82F6", "#2563EB"]} className="items-center justify-center w-full h-full">
              <FontAwesome5 name="directions" size={18} color="white" />
            </LinearGradient>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Navigation</Text>
            <Text className="text-sm text-gray-500 mt-0.5">{subText}</Text>
          </View>
          <View className="w-2 h-2 bg-blue-400 rounded-full" />
        </View>
      </View>
      <View className="px-6 py-6">
        <TouchableOpacity onPress={openDirections} className="flex-row items-center justify-center w-full py-4 bg-gray-800 shadow-md rounded-2xl">
          <FontAwesome6 name="location-arrow" size={16} color="white" />
          <Text className="ml-3 text-lg font-bold text-white">{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TripDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;

  const mineContactSheetRef = useRef(null);
  const buyerContactSheetRef = useRef(null);
  const reportIssueSheetRef = useRef(null);

  const { data: trip, isLoading, isError, refetch } = useFetchTripById(tripId);
  const { mutate: updateMilestone, isLoading: isUpdating } = useUpdateMilestone();
  const { mutate: reportIssue, isLoading: isReporting } = useReportIssue();
  const [isRefreshing, setRefreshing] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPress, setIsPress] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [issueNotes, setIssueNotes] = useState("");

  const OnRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const { lastMilestone, nextAction, allMilestones } = useMemo(() => {
    if (!trip || !trip?.milestone_history) {
      return { lastMilestone: null, nextAction: null, allMilestones: [] };
    }

    const history = trip?.milestone_history?.map((m) => m?.status);
    const lastMilestoneStatus = history?.length > 0 ? history[history?.length - 1] : "trip_assigned";

    const milestones = [
      { id: "trip_started", label: "Start Trip", requires: "trip_assigned", modalText: "Are you sure you want to start the trip?" },
      { id: "arrived_at_pickup", label: "Arrived at Pickup", requires: "trip_started", modalText: "Confirm your arrival at the pickup location." },
      { id: "loading_complete", label: "Confirm Loading", requires: "arrived_at_pickup", modalText: "Confirm that loading is complete." },
      { id: "en_route_to_delivery", label: "Start Delivery", requires: "pickup_verified", modalText: "Confirm you are en route to the delivery location." },
      { id: "arrived_at_delivery", label: "Arrived at Delivery", requires: "en_route_to_delivery", modalText: "Confirm your arrival at the delivery destination." },
      { id: "delivery_complete", label: "Confirm Delivery", requires: "arrived_at_delivery", modalText: "Confirm that the delivery is complete." },
    ];

    let action = null;
    for (const m of milestones) {
      if (history.includes(m.id)) continue;
      if (m.requires === "pickup_verified" && !history.includes("pickup_verified")) {
        if (history.includes("loading_complete")) {
          action = { id: "pickup_verified", label: "Waiting for Mine Owner Verification", disabled: true };
        }
        continue;
      }
      if (history.includes(m.requires)) {
        action = m;
        break;
      }
    }

    if (lastMilestoneStatus === "delivery_complete" && !history.includes("delivery_verified")) {
      action = { id: "delivery_verified", label: "Waiting for Buyer Verification", disabled: true };
    }

    if (trip?.status === "completed") {
      action = { id: "completed", label: "Trip Completed", disabled: true };
    }

    const fullMilestoneList = [
      { id: "trip_assigned", label: "Trip Assigned" },
      { id: "trip_started", label: "Trip Started" },
      { id: "arrived_at_pickup", label: "Arrived at Mine" },
      { id: "loading_complete", label: "Loading Complete" },
      { id: "pickup_verified", label: "Pickup Verified" },
      { id: "en_route_to_delivery", label: "Shipment En Route" },
      { id: "arrived_at_delivery", label: "Arrived at Destination" },
      { id: "delivery_complete", label: "Delivery Complete" },
      { id: "delivery_verified", label: "Trip Completed" },
    ];

    const populatedMilestones = fullMilestoneList.map((m) => {
      const historyEntry = trip?.milestone_history?.find((h) => h?.status === m?.id);
      return { ...m, isCompleted: !!historyEntry, timestamp: historyEntry?.timestamp, isCurrent: lastMilestoneStatus === m?.id };
    });

    return { lastMilestone: lastMilestoneStatus, nextAction: action, allMilestones: populatedMilestones };
  }, [trip]);

  const handleUpdateMilestone = async () => {
    if (!isConfirmed || !nextAction || nextAction.disabled) return;
    if (isPress) return;
    setIsPress(true);
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
          setIsPress(false);
        },
      }
    );
  };

  const handleReportIssue = () => {
    if (!selectedReason) {
      Toast.show({ type: "error", text1: "Please select a reason for the issue." });
      return;
    }
    if (isReportingIssue) return;
    setIsReportingIssue(true);
    reportIssue(
      { tripId, reason: selectedReason, notes: issueNotes },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Issue Reported Successfully" });
          reportIssueSheetRef.current?.close();
          setSelectedReason(null);
          setIssueNotes("");
        },
        onError: (err) => {
          Toast.show({ type: "error", text1: "Failed to Report Issue", text2: err.message || "An unknown error occurred." });
        },
      }
    );
    setIsReportingIssue(false);
  };

  const handleCallPress = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
      mineContactSheetRef.current?.close();
      buyerContactSheetRef.current?.close();
    }
  };

  const renderDirectionsSection = () => {
    const pickupStatuses = ["trip_assigned", "trip_started", "arrived_at_pickup", "loading_complete"];
    const deliveryStatuses = ["pickup_verified", "en_route_to_delivery", "arrived_at_delivery", "delivery_complete"];

    if (pickupStatuses.includes(lastMilestone)) {
      return <GetDirectionsButton destinationLocation={trip?.request_id?.mine_id?.location} buttonText="Directions to Mine" subText="Navigate to the pickup location" />;
    } else if (deliveryStatuses.includes(lastMilestone)) {
      return <GetDirectionsButton destinationLocation={trip?.destination} buttonText="Directions to Delivery" subText="Navigate to the delivery location" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-slate-50">
        <ActivityIndicator size="large" color="#1f2937" />
        <Text className="mt-4 text-lg font-medium text-gray-600">Loading trip details...</Text>
      </View>
    );
  }

  if (isError || !trip) {
    return (
      <View className="items-center justify-center flex-1 px-6 bg-slate-50">
        <Feather name="alert-triangle" size={64} color="#EF4444" />
        <Text className="mt-4 text-xl font-bold text-gray-800">Trip Not Found</Text>
        <Text className="mt-2 text-center text-gray-600">Unable to load trip details. Please check your connection and try again.</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="px-6 py-3 mt-6 bg-blue-600 rounded-2xl">
          <Text className="font-bold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const formatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="flex-row items-center justify-between p-6 pt-4 pb-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Trip Details</Text>
          <View className="w-12 h-12" />
        </View>
      </View>

      <View className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={OnRefresh} />}>
          <View className="px-4 pt-4 pb-2">{trip.status === "canceled" ? <TripCancelBanner cancelReason={trip.cancel_reason} /> : trip.status === "issue_reported" && trip.issue ? <TripIssueReportedBanner issue={trip.issue} /> : <TripStatusBanner lastMilestone={lastMilestone} />}</View>

          {trip.status === "active" && <View className="px-4 py-3">{renderDirectionsSection()}</View>}

          <View className="px-4 py-3">
            <View className="bg-white border border-gray-100 shadow-lg rounded-2xl">
              <View className="px-6 py-5 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 overflow-hidden rounded-xl">
                    <LinearGradient colors={["#4F46E5", "#6366F1"]} className="items-center justify-center w-full h-full">
                      <FontAwesome5 name="clipboard-list" size={18} color="white" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">Trip Details</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">Complete shipment information</Text>
                  </View>
                </View>
              </View>
              <View className="px-2 py-2">
                <View className="border bg-gray-50/70 rounded-xl border-gray-100/50">
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-blue-100 rounded-lg">
                        <FontAwesome5 name="calendar-alt" size={14} color="#3B82F6" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Schedule Date</Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900">{format(new Date(trip.request_id.finalized_agreement.schedule.date), "MMM d, yyyy")}</Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-8 h-8 mr-3 rounded-lg bg-amber-100">
                        <FontAwesome5 name="cube" size={14} color="#F59E0B" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Material</Text>
                    </View>
                    <Text className="font-semibold text-gray-900 text-base max-w-[160px] text-right">{trip.request_id.material_id.name}</Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-purple-100 rounded-lg">
                        <FontAwesome5 name="balance-scale" size={14} color="#8B5CF6" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Quantity</Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900">
                      {trip.request_id.finalized_agreement.quantity} {trip.request_id.finalized_agreement.unit.name}
                    </Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />

                  {/* Price */}
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-green-100 rounded-lg">
                        <FontAwesome5 name="rupee-sign" size={14} color="#10B981" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Total Price</Text>
                    </View>
                    <View className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                      <Text className="text-base font-bold text-green-700">₹{formatter.format(trip.request_id.finalized_agreement.price)}</Text>
                    </View>
                  </View>
                  {trip.status !== "completed" && (
                    <>
                      <View className="mx-5 border-b border-gray-200/60" />
                      <View className="px-5 py-4">
                        <TouchableOpacity onPress={() => reportIssueSheetRef.current?.snapToIndex(0)} className="flex-row items-center justify-center px-4 py-3 transition-colors border border-red-200/80 rounded-xl bg-red-50/80 active:bg-red-100" activeOpacity={0.7}>
                          <View className="items-center justify-center w-8 h-8 mr-3 bg-red-100 rounded-lg">
                            <Feather name="alert-triangle" size={16} color="#EF4444" />
                          </View>
                          <Text className="text-base font-semibold text-red-700">Report Issue</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View className="px-4 py-3">
            <View className="bg-white border border-gray-100 shadow-lg rounded-2xl">
              <View className="px-6 py-5 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 overflow-hidden rounded-xl">
                    <LinearGradient colors={["#F59E0B", "#D97706"]} className="items-center justify-center w-full h-full">
                      <FontAwesome5 name="mountain" size={18} color="white" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">Mine Details</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">Pickup location information</Text>
                  </View>
                </View>
              </View>
              <View className="px-2 py-2">
                <View className="border bg-gray-50/70 rounded-xl border-gray-100/50">
                  <View className="px-5 py-4">
                    <View className="flex-row items-center mb-2">
                      <View className="items-center justify-center w-8 h-8 mr-3 rounded-lg bg-amber-100">
                        <FontAwesome5 name="industry" size={14} color="#F59E0B" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Mine Name</Text>
                    </View>
                    <Text className="text-base font-semibold text-gray-900 ml-11">{trip.request_id.mine_id.name}</Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />
                  <View className="px-5 py-4">
                    <View className="flex-row items-center mb-2">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-red-100 rounded-lg">
                        <FontAwesome5 name="map-marker-alt" size={14} color="#EF4444" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Address</Text>
                    </View>
                    <Text className="text-base font-medium leading-5 text-gray-900 ml-11">{trip.request_id.mine_id.location.address}</Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />
                  {/* ADDED MINE OWNER CONTACT */}
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View className="items-center justify-center w-8 h-8 mr-3 bg-blue-100 rounded-lg">
                          <FontAwesome5 name="user-tie" size={14} color="#3B82F6" />
                        </View>
                        <Text className="text-base font-medium text-gray-700">Mine Owner</Text>
                      </View>
                      <Text className="text-base font-semibold text-gray-900 ml-11">{trip.request_id.mine_id.owner_id.name}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => mineContactSheetRef.current?.snapToIndex(0)} className="ml-4 flex-row items-center px-4 py-2.5 bg-green-500 rounded-lg shadow-sm">
                      <FontAwesome5 name="phone" size={12} color="white" />
                      <Text className="ml-2 text-sm font-semibold text-white">Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="px-4 py-3">
            <View className="bg-white border border-gray-100 shadow-lg rounded-2xl">
              <View className="px-6 py-5 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 overflow-hidden rounded-xl">
                    <LinearGradient colors={["#14B8A6", "#0D9488"]} className="items-center justify-center w-full h-full">
                      <MaterialCommunityIcons name="truck-delivery" size={20} color="white" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">Delivery Details</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">Drop-off location information</Text>
                  </View>
                </View>
              </View>
              <View className="px-2 py-2">
                <View className="border bg-gray-50/70 rounded-xl border-gray-100/50">
                  <View className="px-5 py-4">
                    <View className="flex-row items-center mb-2">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-teal-100 rounded-lg">
                        <FontAwesome5 name="map-pin" size={14} color="#14B8A6" />
                      </View>
                      <Text className="text-base font-medium text-gray-700">Delivery Location</Text>
                    </View>
                    <Text className="text-base font-medium leading-5 text-gray-900 ml-11">{trip.request_id.finalized_agreement.delivery_location.address}</Text>
                  </View>
                  <View className="mx-5 border-b border-gray-200/60" />

                  {/* Buyer */}
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View className="items-center justify-center w-8 h-8 mr-3 bg-purple-100 rounded-lg">
                          <FontAwesome5 name="user-circle" size={14} color="#8B5CF6" />
                        </View>
                        <Text className="text-base font-medium text-gray-700">Buyer</Text>
                      </View>
                      <Text className="text-base font-semibold text-gray-900 ml-11">{trip.request_id.truck_owner_id.name}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => buyerContactSheetRef.current?.snapToIndex(0)} className="ml-4 flex-row items-center px-4 py-2.5 bg-green-500 rounded-lg shadow-sm">
                      <FontAwesome5 name="phone" size={12} color="white" />
                      <Text className="ml-2 text-sm font-semibold text-white">Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="px-4 py-3">
            <View className="bg-white border border-gray-100 shadow-lg rounded-2xl">
              <View className="px-6 py-5 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-12 h-12 mr-4 overflow-hidden rounded-xl">
                    <LinearGradient colors={["#8B5CF6", "#7C3AED"]} className="items-center justify-center w-full h-full">
                      <FontAwesome5 name="route" size={18} color="white" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">Trip Timeline</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">Real-time progress tracking</Text>
                  </View>
                </View>
              </View>
              <View className="px-4 py-4">
                <View className="relative">
                  {allMilestones.map((milestone, index) => {
                    const isLast = index === allMilestones.length - 1;
                    const isCompleted = milestone.isCompleted;
                    const isCurrent = milestone.isCurrent;

                    return (
                      <View key={milestone.id} className="relative flex-row items-start">
                        {!isLast && (
                          <View style={styles.timelineLine}>
                            <LinearGradient colors={isCompleted ? ["#10B981", "#059669"] : ["#E5E7EB", "#D1D5DB"]} className="w-full h-full" />
                          </View>
                        )}
                        <View className="relative z-10 mr-4">
                          <View style={[styles.milestoneNode, isCurrent ? styles.milestoneNodeCurrent : isCompleted ? styles.milestoneNodeCompleted : styles.milestoneNodePending]}>
                            {isCurrent && <View style={styles.pulseAnimation} />}
                            {isCompleted && <View style={styles.completedInnerRing} />}
                            <View className="relative z-10">{isCompleted ? <FontAwesome5 name="check" size={14} color="white" /> : isCurrent ? <FontAwesome5 name="truck" size={14} color="white" /> : <FontAwesome5 name="clock" size={14} color="#9CA3AF" />}</View>
                          </View>
                        </View>
                        <View className={`flex-1 ${!isLast ? "pb-6" : ""}`}>
                          <View style={[styles.milestoneContentBox, isCurrent ? styles.milestoneContentBoxCurrent : isCompleted ? styles.milestoneContentBoxCompleted : styles.milestoneContentBoxPending]}>
                            <Text style={[styles.milestoneLabel, isCurrent ? styles.milestoneLabelCurrent : isCompleted ? styles.milestoneLabelCompleted : styles.milestoneLabelPending]}>{milestone.label}</Text>
                            <View className="flex-row items-center justify-between mt-2">
                              <View className="flex-row items-center">
                                <View style={[styles.milestoneBadge, isCurrent ? styles.milestoneBadgeCurrent : isCompleted ? styles.milestoneBadgeCompleted : styles.milestoneBadgePending]}>
                                  <Text style={[styles.milestoneBadgeText, isCurrent ? styles.milestoneBadgeTextCurrent : isCompleted ? styles.milestoneBadgeTextCompleted : styles.milestoneBadgeTextPending]}>{isCompleted ? "COMPLETED" : isCurrent ? "IN PROGRESS" : "PENDING"}</Text>
                                </View>
                              </View>
                              {isCompleted && <Text className="text-xs font-medium text-gray-600">{format(new Date(milestone.timestamp), "MMM d • hh:mm a")}</Text>}
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="items-center justify-center w-8 h-8 mr-3 bg-purple-100 rounded-lg">
                      <FontAwesome5 name="chart-line" size={14} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-gray-900">Progress</Text>
                      <Text className="text-xs text-gray-500">Trip completion status</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <Text className="text-sm font-bold text-purple-600">{Math.round((allMilestones.filter((m) => m.isCompleted).length / allMilestones.length) * 100)}%</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
            <View className="justify-center flex-1 px-6 bg-black/60">
              <View className="p-8 mx-2 bg-white shadow-2xl rounded-2xl">
                <View className="items-center mb-8">
                  <View style={styles.modalIconContainer} className="mb-4">
                    <LinearGradient colors={["#2563eb", "#1d4ed8"]} style={styles.modalIconGradient}>
                      <FontAwesome6 name="clipboard-check" size={28} color="white" />
                    </LinearGradient>
                  </View>
                  <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Confirm Action</Text>
                  <Text className="px-2 leading-6 text-center text-gray-600">{nextAction?.modalText || `Please confirm the milestone: "${nextAction?.label}". This action will update the trip status.`}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8} onPress={() => setIsConfirmed(!isConfirmed)} className="flex-row items-start p-4 mb-8 bg-gray-50 rounded-xl">
                  <View style={[styles.checkboxBase, isConfirmed && styles.checkboxChecked]}>{isConfirmed && <Feather name="check" size={16} color="white" />}</View>
                  <Text className="flex-1 leading-6 text-gray-800">I confirm that I want to proceed with this action.</Text>
                </TouchableOpacity>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalVisible(false);
                      setIsConfirmed(false);
                    }}
                    className="flex-1 py-4 bg-gray-200 border border-gray-300 rounded-xl"
                  >
                    <Text className="text-base font-semibold text-center text-gray-700">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8} onPress={handleUpdateMilestone} disabled={!isConfirmed || isPress} style={[styles.verifyButton, isConfirmed && !isPress ? styles.verifyButtonEnabled : styles.verifyButtonDisabled]}>
                    {isPress ? (
                      <>
                        <ActivityIndicator size="small" color="white" />
                        {/* <Text style={styles.verifyButtonText}>Updating...</Text> */}
                      </>
                    ) : (
                      <>
                        <FontAwesome6 name="check" size={20} color={isConfirmed ? "white" : "#9CA3AF"} />
                        <Text style={[styles.verifyButtonText, { color: isConfirmed ? "white" : "#6B7280" }]}>Confirm</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </View>

      {nextAction && !nextAction.disabled && (
        <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
          <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)} className="flex-row items-center justify-center w-full py-4 bg-blue-600 rounded-2xl">
            <Feather name="check-circle" size={20} color="white" />
            <Text className="ml-3 text-lg font-bold text-white">{nextAction.label}</Text>
          </TouchableOpacity>
        </View>
      )}

      {nextAction && nextAction.disabled && (
        <View className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-white border-t border-gray-200">
          <View className="flex-row items-center justify-center w-full py-4 bg-gray-300 rounded-2xl">
            <Feather name="clock" size={20} color="#6B7280" />
            <Text className="ml-3 text-lg font-bold text-gray-600">{nextAction.label}</Text>
          </View>
        </View>
      )}

      <ReusableBottomSheet ref={reportIssueSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-6">
            <View className="p-4 mb-4 bg-red-100 rounded-full">
              <Feather name="alert-triangle" size={28} color="#EF4444" />
            </View>
            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Report an Issue</Text>
            <Text className="text-center text-gray-600 text-md">Please select a reason and provide details about the issue.</Text>
          </View>

          <Text className="mb-3 text-base font-semibold text-gray-700">Reason for reporting:</Text>
          <View className="flex-row flex-wrap mb-6">
            {issueReasons.map((reason) => (
              <TouchableOpacity activeOpacity={0.8} key={reason.value} onPress={() => setSelectedReason(reason.value)} className={`px-4 py-2 border rounded-full mr-2 mb-2 ${selectedReason === reason.value ? "bg-red-500 border-red-500" : "bg-gray-100 border-gray-200"}`}>
                <Text className={`font-semibold ${selectedReason === reason.value ? "text-white" : "text-gray-700"}`}>{reason.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mb-3 text-base font-semibold text-gray-700">Notes (Optional):</Text>
          <TextInput value={issueNotes} onChangeText={setIssueNotes} placeholder="Provide specific details about the issue..." multiline className="h-24 p-4 mb-8 text-base bg-gray-100 border border-gray-200 rounded-lg" textAlignVertical="top" />

          <View className="flex-row gap-4 mt-auto">
            <TouchableOpacity onPress={() => reportIssueSheetRef.current?.close()} className="flex-1 p-4 bg-gray-200 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReportIssue} disabled={isReportingIssue || !selectedReason} className={`flex-1 p-4 rounded-2xl flex-row items-center justify-center ${!selectedReason || isReportingIssue ? "bg-red-200" : "bg-red-500"}`}>
              {isReportingIssue ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Feather name="send" size={18} color="white" />
                  <Text className="ml-2 text-lg font-bold text-white">Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={mineContactSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-blue-100 rounded-full">
              <Feather name="phone" size={28} color="#3B82F6" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Mine Owner</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with the mine owner for inquiries</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Owner Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{trip?.request_id?.mine_id?.owner_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{trip?.request_id?.mine_id?.owner_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleCallPress(trip?.request_id?.mine_id?.owner_id?.phone)}
              disabled={!trip?.request_id?.mine_id?.owner_id?.phone}
              className={`flex-row items-center justify-center p-4 rounded-2xl ${!trip?.request_id?.mine_id?.owner_id?.phone ? "bg-gray-200" : "bg-blue-500"}`}
            >
              <FontAwesome6 name="phone" size={18} color={!trip?.request_id?.mine_id?.owner_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!trip?.request_id?.mine_id?.owner_id?.phone ? "text-gray-500" : "text-white"}`}>{!trip?.request_id?.mine_id?.owner_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => mineContactSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={buyerContactSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-green-100 rounded-full">
              <Feather name="phone" size={28} color="#10B981" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Buyer</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with the buyer for inquiries</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Buyer Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{trip?.request_id?.truck_owner_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{trip?.request_id?.truck_owner_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleCallPress(trip?.request_id?.truck_owner_id?.phone)}
              disabled={!trip?.request_id?.truck_owner_id?.phone}
              className={`flex-row items-center justify-center p-4 rounded-2xl ${!trip?.request_id?.truck_owner_id?.phone ? "bg-gray-200" : "bg-green-500"}`}
            >
              <FontAwesome6 name="phone" size={18} color={!trip?.request_id?.truck_owner_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!trip?.request_id?.truck_owner_id?.phone ? "text-gray-500" : "text-white"}`}>{!trip?.request_id?.truck_owner_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => buyerContactSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

export default TripDetailScreen;

const styles = StyleSheet.create({
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  modalIconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBase: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    marginTop: 2,
    borderColor: "#9CA3AF",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  verifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  verifyButtonEnabled: {
    backgroundColor: "#2563eb",
  },
  verifyButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  verifyButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  timelineLine: {
    position: "absolute",
    left: 24,
    top: 48,
    width: 2,
    height: "100%",
    zIndex: 0,
  },
  milestoneNode: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneNodeCurrent: {
    backgroundColor: "#3B82F6",
    shadowColor: "#3B82F6",
    elevation: 8,
  },
  milestoneNodeCompleted: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    elevation: 4,
  },
  milestoneNodePending: {
    backgroundColor: "#D1D5DB",
  },
  pulseAnimation: {
    position: "absolute",
    inset: 0,
    backgroundColor: "#60A5FA",
    borderRadius: 24,
    opacity: 0.75,
  },
  completedInnerRing: {
    position: "absolute",
    backgroundColor: "#34D399",
    borderRadius: 24,
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
  },
  milestoneContentBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  milestoneContentBoxCurrent: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  milestoneContentBoxCompleted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  milestoneContentBoxPending: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  milestoneLabelCurrent: {
    color: "#1E3A8A",
  },
  milestoneLabelCompleted: {
    color: "#065F46",
  },
  milestoneLabelPending: {
    color: "#6B7280",
  },
  milestoneBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  milestoneBadgeCurrent: {
    backgroundColor: "#DBEAFE",
  },
  milestoneBadgeCompleted: {
    backgroundColor: "#D1FAE5",
  },
  milestoneBadgePending: {
    backgroundColor: "#F3F4F6",
  },
  milestoneBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  milestoneBadgeTextCurrent: {
    color: "#1D4ED8",
  },
  milestoneBadgeTextCompleted: {
    color: "#047857",
  },
  milestoneBadgeTextPending: {
    color: "#6B7280",
  },
});
