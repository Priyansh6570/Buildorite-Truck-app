import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Linking, RefreshControl } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFetchTripById, useVerifyMilestone } from "../../hooks/useTrip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../store/authStore";
import truckSocketService from "../../api/truckSocket"; // Use truck socket service
import LiveTrack from "../../components/Trip/LiveTrack";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const DetailItem = ({ icon, iconBg, label, value, onCtaPress, children }) => (
  <View className="flex-row items-center py-3">
    <View className={`w-12 h-12 rounded-2xl items-center justify-center ${iconBg}`}>
      <FontAwesome6 name={icon} size={17} color="white" solid />
    </View>
    <View className="flex-1 ml-4">
      <Text className="text-base font-bold text-gray-800">{label}</Text>
      <Text className="text-sm text-gray-500">{value}</Text>
    </View>
    {onCtaPress && (
      <TouchableOpacity onPress={onCtaPress} className="p-3 bg-green-100 rounded-2xl">
        <FontAwesome6 name="phone" size={18} color="#166534" />
      </TouchableOpacity>
    )}
    {children}
  </View>
);

// Redesigned Milestone component for the timeline
const Milestone = ({ label, timestamp, isCompleted, isCurrent, isLast }) => {
  const getStatusText = () => {
    if (isCompleted) return format(new Date(timestamp), "MMM d, h:mm a");
    if (isCurrent) return "In Progress...";
    return "Pending";
  };

  const getStatusColor = () => {
    if (isCurrent) return "text-blue-600";
    if (isCompleted) return "text-gray-600";
    return "text-gray-400";
  };

  return (
    <View className="flex-row items-center">
      <View className="z-10 items-center justify-center w-12">
        <View className={`w-8 h-8 rounded-full items-center justify-center ${isCompleted || isCurrent ? (isCurrent ? "bg-blue-500" : "bg-green-500") : "bg-gray-300"}`}>
          {isCompleted && !isCurrent ? <Feather name="check" size={16} color="white" /> : <FontAwesome6 name="truck-fast" size={12} color="white" />}
        </View>
      </View>
      <View className={`flex-1 py-6 ml-4 ${!isLast ? "border-b border-gray-200" : ""}`}>
        <Text className={`text-base font-bold ${isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"}`}>{label}</Text>
        <Text className={`mt-1 text-sm font-semibold ${getStatusColor()}`}>{getStatusText()}</Text>
      </View>
    </View>
  );
};

// Redesigned TripStatusBanner with a case for every milestone
const TripStatusBanner = ({ lastMilestone }) => {
  const details = useMemo(() => {
    const baseStyle = "flex-row items-center p-4 border rounded-3xl";
    const iconContainerBase = "w-14 h-14 rounded-2xl items-center justify-center mr-4";

    switch (lastMilestone) {
      case "trip_assigned":
        return {
          style: `${baseStyle} bg-gray-100 border-gray-200`,
          icon: "file-signature",
          iconContainer: `${iconContainerBase} bg-gray-800`,
          heading: "Trip Assigned",
          subheading: "The trip is scheduled and will begin soon.",
          textColor: "text-gray-900",
          subTextColor: "text-gray-600",
        };
      case "trip_started":
        return {
          style: `${baseStyle} bg-blue-50 border-blue-100`,
          icon: "truck-fast",
          iconContainer: `${iconContainerBase} bg-blue-600`,
          heading: "Trip Started",
          subheading: "Driver is on the way to the pickup location.",
          textColor: "text-blue-900",
          subTextColor: "text-blue-700",
        };
      case "arrived_at_pickup":
        return {
          style: `${baseStyle} bg-indigo-50 border-indigo-100`,
          icon: "location-dot",
          iconContainer: `${iconContainerBase} bg-indigo-600`,
          heading: "Arrived at Mine",
          subheading: "Driver is ready for material loading.",
          textColor: "text-indigo-900",
          subTextColor: "text-indigo-700",
        };
      case "loading_complete":
        return {
          style: `${baseStyle} bg-amber-50 border-amber-200`,
          icon: "box-open",
          iconContainer: `${iconContainerBase} bg-amber-500`,
          heading: "Loading Complete",
          subheading: "Awaiting pickup verification.",
          textColor: "text-amber-900",
          subTextColor: "text-amber-700",
        };
      case "pickup_verified":
        return {
          style: `${baseStyle} bg-lime-50 border-lime-200`,
          icon: "check-double",
          iconContainer: `${iconContainerBase} bg-lime-600`,
          heading: "Pickup Verified",
          subheading: "The shipment is ready for departure.",
          textColor: "text-lime-900",
          subTextColor: "text-lime-700",
        };
      case "en_route_to_delivery":
        return {
          style: `${baseStyle} bg-green-50 border-green-200`,
          icon: "route",
          iconContainer: `${iconContainerBase} bg-green-600`,
          heading: "Shipment En Route",
          subheading: "On the way to the delivery location.",
          textColor: "text-green-900",
          subTextColor: "text-green-700",
        };
      case "arrived_at_delivery":
        return {
          style: `${baseStyle} bg-teal-50 border-teal-200`,
          icon: "flag-checkered",
          iconContainer: `${iconContainerBase} bg-teal-600`,
          heading: "Arrived at Destination",
          subheading: "Driver has reached the delivery point.",
          textColor: "text-teal-900",
          subTextColor: "text-teal-700",
        };
      case "delivery_complete":
        return {
          style: `${baseStyle} bg-orange-50 border-orange-200`,
          icon: "boxes-packing",
          iconContainer: `${iconContainerBase} bg-orange-500`,
          heading: "Delivery Complete",
          subheading: "Unloading is finished. Awaiting buyer's verification.",
          textColor: "text-orange-900",
          subTextColor: "text-orange-700",
        };
      case "delivery_verified":
        return {
          style: `${baseStyle} bg-emerald-50 border-emerald-200`,
          icon: "shield-check",
          iconContainer: `${iconContainerBase} bg-emerald-600`,
          heading: "Trip Completed",
          subheading: "The delivery has been successfully verified.",
          textColor: "text-emerald-900",
          subTextColor: "text-emerald-700",
        };
      default:
        return null;
    }
  }, [lastMilestone]);

  if (!details) return null;

  return (
    <View style={styles.card}>
      <View className={details.style}>
        <View className={details.iconContainer}>
          <FontAwesome6 name={details.icon} size={22} color="white" solid />
        </View>
        <View className="flex-1">
          <Text className={`text-lg font-extrabold ${details.textColor}`}>{details.heading}</Text>
          <Text className={`text-sm ${details.subTextColor}`}>{details.subheading}</Text>
        </View>
      </View>
    </View>
  );
};

const TruckOwnerTripDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { tripId } = route.params;

  const { user } = useAuthStore();
  const currentUser = user ? user : null;

  const contactBottomSheetRef = useRef(null);
  const [contactPerson, setContactPerson] = useState(null);

  const { data: trip, isLoading, isError, refetch } = useFetchTripById(tripId);
  const { mutate: verifyMilestone, isLoading: isVerifying } = useVerifyMilestone();
  const [isRefreshing, setRefreshing] = useState(false);

  const [isModalVisible, setModalVisible] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Tracking state for truck owners
  const [liveDriverLocation, setLiveDriverLocation] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState("idle");
  const [trackingError, setTrackingError] = useState("");
  const [showMap, setShowMap] = useState(false);

  const retryAttemptRef = useRef(0);
  const maxRetries = 1;
  const autoRetryTimeoutRef = useRef(null);

  const OnRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }
    };
  }, []);

  // Socket setup for truck owners (only for tracking)
  useEffect(() => {
    console.log(`🔧 [Truck Owner] Setting up socket listeners for trip: ${tripId}`);

    const handleLocationUpdate = (data) => {
      console.log("📍 [Truck Owner] Location received, setting status to active.", data);
      setLiveDriverLocation({ coordinates: data.coordinates, timestamp: new Date() });
      setTrackingStatus("active");
      retryAttemptRef.current = 0;
    };

    const handleTrackingStarted = ({ tripId: receivedTripId, message }) => {
      console.log(`✅ [Truck Owner] Tracking started for trip: ${receivedTripId} - ${message}`);
      setTrackingStatus("active");
      retryAttemptRef.current = 0;
    };

    const handleTrackingFailed = ({ reason, tripId: receivedTripId }) => {
      console.error(`❌ [Truck Owner] Tracking failed for trip: ${receivedTripId} - ${reason}`);

      if (retryAttemptRef.current < maxRetries) {
        console.log(`🔄 [Truck Owner] Auto-retrying tracking attempt ${retryAttemptRef.current + 1}/${maxRetries}`);
        retryAttemptRef.current += 1;

        autoRetryTimeoutRef.current = setTimeout(() => {
          console.log(`🚀 [Truck Owner] Executing auto-retry for trip: ${tripId}`);
          handleStartTracking(true);
        }, 3000);
      } else {
        console.error(`❌ [Truck Owner] Max retries reached, showing error to user`);
        setTrackingError(reason || "The driver could not be reached.");
        setTrackingStatus("failed");
        retryAttemptRef.current = 0;
      }
    };

    const handleDriverOffline = ({ reason, tripId: receivedTripId }) => {
      console.warn(`🔴 [Truck Owner] Driver went offline for trip: ${receivedTripId} - ${reason}`);

      if (retryAttemptRef.current < maxRetries) {
        console.log(`🔄 [Truck Owner] Auto-retrying tracking for offline driver attempt ${retryAttemptRef.current + 1}/${maxRetries}`);
        retryAttemptRef.current += 1;

        autoRetryTimeoutRef.current = setTimeout(() => {
          console.log(`🚀 [Truck Owner] Executing auto-retry for offline driver: ${tripId}`);
          handleStartTracking(true);
        }, 5000);
      } else {
        console.error(`❌ [Truck Owner] Max retries reached for offline driver, showing error to user`);
        setTrackingError(reason || "Driver appears to be offline.");
        setTrackingStatus("offline");
        retryAttemptRef.current = 0;
      }
    };

    // Register socket event listeners
    truckSocketService.on("driverLocationUpdated", handleLocationUpdate);
    truckSocketService.on("tracking_started", handleTrackingStarted);
    truckSocketService.on("tracking_failed", handleTrackingFailed);
    truckSocketService.on("driver_went_offline", handleDriverOffline);

    console.log(`✅ [Truck Owner] Socket listeners registered for trip: ${tripId}`);

    return () => {
      console.log(`🧹 [Truck Owner] Cleaning up socket listeners for trip: ${tripId}`);

      if (autoRetryTimeoutRef.current) {
        clearTimeout(autoRetryTimeoutRef.current);
      }

      truckSocketService.off("driverLocationUpdated", handleLocationUpdate);
      truckSocketService.off("tracking_started", handleTrackingStarted);
      truckSocketService.off("tracking_failed", handleTrackingFailed);
      truckSocketService.off("driver_went_offline", handleDriverOffline);

      // Stop tracking and disconnect when leaving the screen
      if (truckSocketService.isConnected()) {
        truckSocketService.emit("stopTrackingTrip", { tripId });
        truckSocketService.stopTrackingMode();
      }
    };
  }, [tripId]);

  const handleStartTracking = (isAutoRetry = false) => {
    if (!trip || !currentUser) {
      return;
    }

    const logPrefix = isAutoRetry ? "[Auto-Retry]" : "[Manual]";
    console.log(`🚀 [Truck Owner] ${logPrefix} Starting tracking for trip: ${tripId}`);

    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }

    setTrackingStatus("pending");
    setTrackingError("");
    setShowMap(false);
    setLiveDriverLocation(null);

    if (!isAutoRetry) {
      retryAttemptRef.current = 0;
    }

    // Start tracking mode for truck socket service
    truckSocketService.startTrackingMode();

    const onConnect = () => {
      console.log(`🔌 [Truck Owner] ${logPrefix} Socket connected: ${truckSocketService.socket.id}, emitting startTrackingTrip`);
      const payload = {
        userId: currentUser.id,
        tripId: tripId,
        driverId: trip.driver_id._id,
      };
      console.log(`📤 [Truck Owner] ${logPrefix} Sending tracking payload:`, payload);
      truckSocketService.emit("startTrackingTrip", payload);
      truckSocketService.socket.off("connect", onConnect);
    };

    const onConnectError = (err) => {
      console.error(`❌ [Truck Owner] ${logPrefix} Socket connection error:`, err);

      if (!isAutoRetry && retryAttemptRef.current < maxRetries) {
        console.log(`🔄 [Truck Owner] Connection error, auto-retrying attempt ${retryAttemptRef.current + 1}/${maxRetries}`);
        retryAttemptRef.current += 1;

        autoRetryTimeoutRef.current = setTimeout(() => {
          handleStartTracking(true);
        }, 3000);
      } else {
        setTrackingError("Could not connect to the tracking server.");
        setTrackingStatus("failed");
        if (isAutoRetry) {
          retryAttemptRef.current = 0;
        }
      }

      truckSocketService.socket.off("connect_error", onConnectError);
    };

    if (truckSocketService.isConnected()) {
      console.log(`🔌 [Truck Owner] ${logPrefix} Socket already connected, sending immediately`);
      onConnect();
    } else {
      console.log(`🔌 [Truck Owner] ${logPrefix} Socket not connected, waiting for connection...`);
      truckSocketService.socket.on("connect", onConnect);
      truckSocketService.socket.on("connect_error", onConnectError);
    }
  };

  const handleStopTracking = () => {
    console.log(`🛑 [Truck Owner] User stopped tracking for trip: ${tripId}`);

    if (autoRetryTimeoutRef.current) {
      clearTimeout(autoRetryTimeoutRef.current);
    }

    retryAttemptRef.current = 0;

    if (truckSocketService.isConnected()) {
      truckSocketService.emit("stopTrackingTrip", { tripId });
    }

    // Stop tracking mode
    truckSocketService.stopTrackingMode();

    setTrackingStatus("idle");
    setLiveDriverLocation(null);
    setTrackingError("");
    setShowMap(false);
  };

  const handleManualRetry = () => {
    console.log(`🔄 [Truck Owner] Manual retry triggered by user for trip: ${tripId}`);
    retryAttemptRef.current = 0;
    handleStartTracking(false);
  };

  // Memoized values for trip status and actions
  const { actionToTake, allMilestones, lastMilestone } = useMemo(() => {
    if (!trip) return { actionToTake: null, allMilestones: [], lastMilestone: null };

    const history = trip.milestone_history.map((m) => m.status);
    const lastMilestoneStatus = history.length > 0 ? history[history.length - 1] : "trip_assigned";

    let action = null;
    if (trip.status === "active" && lastMilestoneStatus === "loading_complete" && !history.includes("pickup_verified")) {
      action = { id: "pickup_verified", label: "Verify Pickup" };
    }

    const fullMilestoneList = [
      { id: "trip_assigned", label: "Trip Assigned" },
      { id: "trip_started", label: "Trip Started" },
      { id: "arrived_at_pickup", label: "Arrived at Mine" },
      { id: "loading_complete", label: "Loading Complete" },
      { id: "pickup_verified", label: "Pickup Verified by Mine Owner" },
      { id: "en_route_to_delivery", label: "En Route to Delivery" },
      { id: "arrived_at_delivery", label: "Arrived at Delivery" },
      { id: "delivery_complete", label: "Delivery Complete" },
      { id: "delivery_verified", label: "Delivery Verified by You" },
    ];

    const populatedMilestones = fullMilestoneList.map((m) => {
      const historyEntry = trip.milestone_history.find((h) => h.status === m.id);
      return { ...m, isCompleted: !!historyEntry, timestamp: historyEntry?.timestamp, isCurrent: lastMilestoneStatus === m.id };
    });

    return { actionToTake: action, allMilestones: populatedMilestones, lastMilestone: lastMilestoneStatus };
  }, [trip]);

  // Handler for opening the contact bottom sheet
  const handleContactPress = (person) => {
    setContactPerson(person);
    contactBottomSheetRef.current?.snapToIndex(0);
  };

  // Handler for making a call
  const handleCallPress = () => {
    const phoneNumber = contactPerson?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
      contactBottomSheetRef.current?.close();
    }
  };

  // Handler for verifying milestone
  const handleVerifyMilestone = () => {
    if (!isConfirmed || !actionToTake) return;
    verifyMilestone(
      { tripId, status: actionToTake.id },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Milestone Verified!" });
          refetch();
        },
        onError: (err) => Toast.show({ type: "error", text1: "Verification Failed", text2: err.message }),
        onSettled: () => {
          setModalVisible(false);
          setIsConfirmed(false);
        },
      }
    );
  };

  const renderTrackingContent = () => {
    switch (trackingStatus) {
      case "pending":
        return (
          <View className="flex-row items-center justify-between p-4 bg-gray-100 rounded-2xl">
            <ActivityIndicator size="small" color="#111827" />
            <Text className="ml-4 font-semibold text-gray-700">{retryAttemptRef.current > 0 ? `Retrying... (${retryAttemptRef.current}/${maxRetries})` : "Locating Driver..."}</Text>
            <View className="flex-1" />
            <TouchableOpacity onPress={handleStopTracking} className="p-2 bg-gray-200 rounded-full">
              <Feather name="x" size={18} color="#4B5563" />
            </TouchableOpacity>
          </View>
        );

      case "active":
        return (
          <View>
            {showMap ? (
              <View>
                <LiveTrack driverLocation={liveDriverLocation} mineLocation={trip?.request_id?.mine_id?.location} deliveryLocation={trip?.destination} milestoneHistory={trip?.milestone_history || []} />
                <TouchableOpacity activeOpacity={0.8} onPress={() => setShowMap(false)} className="flex-row items-center justify-center w-full py-4 mt-4 bg-gray-200 rounded-2xl">
                  <Feather name="map" size={18} color="#374151" />
                  <Text className="ml-3 text-lg font-bold text-gray-800">Hide Map</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-between p-4 border border-green-200 bg-green-50 rounded-2xl">
                <Feather name="check-circle" size={20} color="#16A34A" />
                <Text className="ml-3 font-semibold text-green-800">Driver is Online</Text>
                <View className="flex-1" />
                <TouchableOpacity onPress={() => setShowMap(true)} className="px-4 py-2 mr-2 bg-white border border-gray-300 rounded-full">
                  <Text className="font-bold text-gray-800">Show Map</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleStopTracking} className="p-2 bg-red-100 rounded-full">
                  <Feather name="stop-circle" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        );

      case "failed":
      case "offline":
        return (
          <View className="p-4 border border-red-200 bg-red-50 rounded-2xl">
            <View className="flex-row items-center">
              <Feather name="alert-triangle" size={20} color="#DC2626" />
              <Text className="ml-3 font-semibold text-red-800">Tracking Failed</Text>
            </View>
            <Text className="mt-2 text-red-700">{trackingError}</Text>
            <View className="flex-row mt-4">
              <TouchableOpacity onPress={handleManualRetry} className="flex-row items-center justify-center flex-1 px-4 py-3 bg-gray-800 rounded-xl">
                <Feather name="refresh-cw" size={16} color="white" />
                <Text className="ml-2 font-bold text-center text-white">Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStopTracking} className="flex-row items-center justify-center px-4 py-3 ml-2 bg-gray-200 rounded-xl">
                <Text className="font-bold text-center text-gray-700">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case "idle":
      default:
        return (
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleStartTracking(false)} className="flex-row items-center justify-center w-full py-4 mt-2 bg-gray-900 rounded-2xl">
            <FontAwesome6 name="location-dot" size={18} color="white" />
            <Text className="ml-3 text-lg font-bold text-white">Track Driver</Text>
          </TouchableOpacity>
        );
    }
  };

  if (isLoading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  if (isError || !trip)
    return (
      <View style={styles.container}>
        <Text>Could not load trip details.</Text>
      </View>
    );

  const agreement = trip.request_id.finalized_agreement;
  const showLiveTrackComponent = trip.status === "active";

  return (
    <View style={styles.flexOne}>
      <View style={{ paddingTop: insets.top + 20, ...styles.header }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-gray-900" numberOfLines={1}>
          {trip.request_id.material_id.name}
        </Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView} refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={OnRefresh} />}>
        <TripStatusBanner lastMilestone={lastMilestone} />

        {actionToTake && (
          <View style={styles.card}>
            <View className="flex-row items-center p-4 border-2 border-orange-200 bg-orange-50 rounded-3xl">
              <View className="items-center justify-center mr-4 bg-orange-500 w-14 h-14 rounded-2xl">
                <FontAwesome6 name="clipboard-check" size={24} color="white" solid />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-orange-900">Action Required</Text>
                <Text className="text-sm text-orange-700">Verify pickup completion</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(true)} disabled={isVerifying} className="px-5 py-3 bg-orange-500 rounded-xl">
                {isVerifying ? <ActivityIndicator color="white" size="small" /> : <Text className="font-bold text-white">Verify</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {showLiveTrackComponent && (
          <View style={styles.card}>
            <Text className="text-xl font-bold text-gray-900">Live Tracking</Text>
            <View className="mt-4">{renderTrackingContent()}</View>
          </View>
        )}

        <View style={styles.card}>
          <Text className="mb-4 text-xl font-bold text-gray-900">Trip Details</Text>
          <DetailItem icon="calendar" iconBg="bg-purple-500" label={format(new Date(agreement.schedule.date), "MMMM d, yyyy")} value={format(new Date(agreement.schedule.date), "eeee, h:mm a")} />
          <DetailItem icon="cubes" iconBg="bg-green-500" label={trip.request_id.material_id.name} value={`${agreement.quantity} ${agreement.unit.name || "units"}`} />
          <DetailItem icon="user" iconBg="bg-blue-500" label={trip.driver_id.name} value="Driver" onCtaPress={() => handleContactPress({ name: trip.driver_id.name, phone: trip.driver_id.phone, type: "Driver" })} />
          <DetailItem icon="truck" iconBg="bg-red-500" label={trip.truck_id.name} value={trip.truck_id.registration_number.toUpperCase()} />
          {trip.request_id.mine_owner_id && (
            <DetailItem icon="hard-hat" iconBg="bg-yellow-500" label={trip.request_id.mine_owner_id.name} value="Mine Owner" onCtaPress={() => handleContactPress({ name: trip.request_id.mine_owner_id.name, phone: trip.request_id.mine_owner_id.phone, type: "Mine Owner" })} />
          )}
        </View>

        <View style={styles.card}>
          <Text className="mb-2 text-xl font-bold text-gray-900">Trip Timeline</Text>
          {allMilestones.map((m, index) => (
            <Milestone key={m.id} {...m} isLast={index === allMilestones.length - 1} />
          ))}
        </View>

        <Modal transparent={true} visible={isModalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View className="items-center justify-center w-16 h-16 mb-5 bg-blue-100 rounded-2xl">
                <FontAwesome6 name="shield-halved" size={32} color="#3B82F6" />
              </View>
              <Text style={styles.modalTitle}>Confirm Verification</Text>
              <Text style={styles.modalText}>Please confirm that the material has been picked up and the trip can proceed to the next stage.</Text>

              <TouchableOpacity activeOpacity={0.8} onPress={() => setIsConfirmed(!isConfirmed)} className="flex-row items-center w-full p-4 my-6 bg-gray-100 rounded-2xl">
                <View className={`w-6 h-6 border-2 rounded-md items-center justify-center ${isConfirmed ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"}`}>{isConfirmed && <Feather name="check" size={16} color="white" />}</View>
                <Text className="flex-1 ml-4 text-base text-gray-800">I confirm the pickup is complete.</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={handleVerifyMilestone} disabled={!isConfirmed || isVerifying} className={`w-full py-4 rounded-2xl ${!isConfirmed || isVerifying ? "bg-gray-300" : "bg-gray-800"}`}>
                {isVerifying ? <ActivityIndicator color="white" /> : <Text className="text-lg font-bold text-center text-white">Verify Pickup</Text>}
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(false)} className="w-full py-4 mt-2">
                <Text className="text-base font-bold text-center text-gray-600">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <ReusableBottomSheet ref={contactBottomSheetRef} snapPoints={["50%"]}>
        <View className="flex-1 p-6 bg-white">
          <View className="items-center mb-6">
            <View className="p-4 mb-4 bg-blue-100 rounded-2xl">
              <Feather name="phone-call" size={32} color="#3B82F6" />
            </View>
            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Contact {contactPerson?.type}</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch for any trip-related updates.</Text>
          </View>

          <View className="p-4 mb-6 bg-gray-50 rounded-2xl">
            <View className="flex-row items-center mb-4">
              <View className="p-3 mr-4 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="user" size={18} color="#6B7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">{contactPerson?.name || "Not available"}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="p-3 mr-4 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="phone" size={18} color="#6B7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">{contactPerson?.phone ? `${contactPerson.phone}` : "Not available"}</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-auto">
            <TouchableOpacity activeOpacity={0.7} onPress={() => contactBottomSheetRef.current?.close()} className="items-center justify-center flex-1 p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleCallPress} disabled={!contactPerson?.phone} className={`flex-row items-center justify-center flex-1 p-4 rounded-2xl ${!contactPerson?.phone ? "bg-gray-300" : "bg-blue-600"}`}>
              <FontAwesome6 name="phone" size={18} color={"#ffffff"} solid />
              <Text className={`ml-2.5 text-lg font-bold text-white`}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  scrollView: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#1F2937",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6B7280",
    marginTop: 12,
    lineHeight: 24,
  },
});

export default TruckOwnerTripDetailScreen;
