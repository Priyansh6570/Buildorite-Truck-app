import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useFetchDriverDetails } from "../../hooks/useTruck";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const formatTripNumber = (index) => {
  const tripNum = index + 1;
  return `Trip #TR-${String(tripNum).padStart(3, "0")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ScreenHeader = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-row items-center justify-center px-8 pb-8 bg-gray-900" style={{ paddingTop: insets.top + 20 }}>
      <TouchableOpacity onPress={onBack} activeOpacity={0.8} className="absolute left-6 p-3 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl" style={{ top: insets.top + 12 }}>
        <Feather name="arrow-left" size={24} color="white" />
      </TouchableOpacity>
      <Text className="text-2xl font-bold text-white">Driver Details</Text>
    </View>
  );
};

const DriverInfoCard = ({ driver, onCallPress }) => (
  <View className="p-6 m-4 mb-8 bg-white border shadow-xl rounded-3xl border-slate-200 shadow-gray-xl">
    <View className="flex-row items-center">
      <View className="overflow-hidden rounded-xl">
        <LinearGradient colors={["#41EC8A", "#3AF6C6"]} className="p-4">
          <FontAwesome6 name="user" size={20} solid color="white" />
        </LinearGradient>
      </View>
      <View className="flex-1 mx-4">
        <Text className="mb-1 text-xl font-bold text-black" numberOfLines={1}>
          {driver?.name}
        </Text>
        <Text className="font-semibold text-gray-500 text-md">+91 {driver?.phone}</Text>
      </View>
      <TouchableOpacity onPress={onCallPress} activeOpacity={0.8}>
        <View className="overflow-hidden rounded-xl">
          <LinearGradient colors={["#2c3e50", "#000000"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center justify-center p-4">
            <FontAwesome6 name="phone" size={18} color="white" />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>

    <View className="flex-row items-center p-4 py-5 mt-6 bg-[#F9FAFB] border border-slate-200 rounded-2xl">
      <View className="mr-1 overflow-hidden rounded-xl">
        <LinearGradient colors={["#6877E0", "#7450A9"]} className="p-4 pr-3">
          <FontAwesome6 name="truck" size={18} color="white" />
        </LinearGradient>
      </View>
      <View className="flex-1 mx-3">
        <Text className="text-sm font-medium text-gray-600">VEHICLE</Text>
        <Text className="text-lg font-bold text-black" numberOfLines={1}>
          {driver?.truck_id?.name}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-medium text-gray-600">REG. NUMBER</Text>
        <Text className="text-lg font-bold text-black">{driver?.truck_id?.registration_number}</Text>
      </View>
    </View>
  </View>
);

const CurrentTripCard = ({ trip, navigation }) => {
  const latestMilestone = trip.milestone_history[trip.milestone_history.length - 1];

  const formatMilestoneText = (status) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <View className="p-6 mx-4 mb-8 bg-[#EFF6FF] border-[#BFDBFE] border-2 shadow-lg rounded-3xl">
      <View className="flex-row items-center mb-4">
        <View className="mr-4 overflow-hidden rounded-2xl">
          <LinearGradient colors={["#44B6FE", "#0AE9FE"]} className="p-4">
            <FontAwesome6 name="route" size={16} color="white" />
          </LinearGradient>
        </View>
        <View>
          <Text className="text-xl font-extrabold text-black">Current Trip</Text>
          <Text className="font-semibold text-[#2563EB]">In Progress</Text>
        </View>
      </View>

      <View className="flex-col gap-4 px-1">
        <View className="flex-row justify-between">
          <Text className="font-bold text-[#6C7582]">Origin</Text>
          <Text className="font-semibold text-right text-black">{trip.request_id?.mine_id?.name}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-bold text-[#6C7582]">Destination</Text>
          <Text className="w-2/3 font-semibold text-right text-black" numberOfLines={1}>
            {trip.destination?.address?.split(",")[0]}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-[#6C7582]">Material</Text>
          <Text className="font-semibold text-black">{trip.request_id?.material_id?.name}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-bold text-[#6C7582]">Status</Text>
          <Text className="font-semibold text-[#2563EB]">{formatMilestoneText(latestMilestone.status)}</Text>
        </View>
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("TruckOwnerTripDetail", { tripId: trip._id })}>
        <View className="flex-row items-center p-6 mt-5 bg-white border border-[#BFDBFE] rounded-2xl">
          <View className="mr-1 overflow-hidden rounded-xl">
            <LinearGradient colors={["#6877E0", "#7450A9"]} className="p-3 px-4">
              <FontAwesome6 name="clipboard-list" size={15} color="white" />
            </LinearGradient>
          </View>
          <Text className="flex-1 ml-3 text-lg font-medium text-black">Trip Details</Text>
          <Text className="font-semibold text-[#5082EF]">View Trip</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const TripItem = ({ trip, index }) => {
  const STYLES = {
    active: {
      icon: "truck",
      iconGradient: ["#42EB86", "#39F7CC"],
      borderColor: "border-[#BBF7D0]",
      bgColor: "bg-[#F0FDF4]",
      badgeBg: "bg-[#DCFCE7]",
      badgeText: "text-[#1FA650]",
    },
    completed: {
      icon: "check",
      iconGradient: ["#8B5CF6", "#6D28D9"],
      borderColor: "border-slate-200",
      bgColor: "bg-[#F9FAFB]",
      badgeBg: "bg-[#F3F4F6]",
      badgeText: "text-[#4B5563]",
    },
    canceled: {
      icon: "times",
      iconGradient: ["#F97316", "#EA580C"],
      borderColor: "border-orange-200",
      bgColor: "bg-orange-50",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-600",
    },
    issue_reported: {
      icon: "triangle-exclamation",
      iconGradient: ["#EF4444", "#DC2626"],
      borderColor: "border-red-200",
      bgColor: "bg-red-50",
      badgeBg: "bg-red-100",
      badgeText: "text-red-600",
    },
  };
  const style = STYLES[trip.status] || STYLES.completed;

  return (
    <View className={`p-4 mb-3 border rounded-2xl ${style.borderColor} ${style.bgColor}`}>
      <View className="flex-row items-start">
        <View className="overflow-hidden rounded-xl">
          <LinearGradient colors={style.iconGradient} className="p-4">
            <FontAwesome6 name={style.icon} size={20} color="white" />
          </LinearGradient>
        </View>
        <View className="flex-1 mx-4">
          <Text className="text-lg font-extrabold text-black">{formatTripNumber(index)}</Text>
          <Text className="text-gray-500">{formatDate(trip.started_at)}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${style.badgeBg}`}>
          <Text className={`font-bold uppercase ${style.badgeText}`}>{trip.status.replace("_", " ")}</Text>
        </View>
      </View>
      <View className="flex-row justify-between mt-4">
        <Text className="font-semibold text-gray-500">{trip.request_id?.material_id?.name}</Text>
        <Text className="font-bold text-black">{trip.request_id?.finalized_agreement?.quantity} Ton</Text>
      </View>
    </View>
  );
};

const NoTripsAssigned = () => (
  <View className="items-center justify-center p-10 m-4 bg-gray-50 rounded-3xl">
    <Feather name="truck" size={40} color="#D1D5DB" />
    <Text className="mt-4 text-xl font-bold text-gray-700">No Trips Yet</Text>
    <Text className="mt-1 text-center text-gray-500">This driver has not been assigned any trips.</Text>
  </View>
);

const DriverDetailScreen = ({ route }) => {
  const { driverId } = route.params;
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState("Active");
  const contactBottomSheetRef = useRef(null);

  const { data, isLoading, error } = useFetchDriverDetails(driverId);

  const currentTrips = useMemo(() => {
    if (!data?.assigned_trip_id) return [];
    return data.assigned_trip_id.filter((trip) => {
      if (trip.milestone_history.length === 0) return false;
      const latestStatus = trip.milestone_history[trip.milestone_history.length - 1].status;
      return latestStatus !== "trip_assigned" && latestStatus !== "delivery_verified";
    });
  }, [data]);

  const filteredTripsByTab = useMemo(() => {
    if (!data?.assigned_trip_id) return [];
    const statusMap = {
      Active: "active",
      Completed: "completed",
      Canceled: "canceled",
      Issues: "issue_reported",
    };
    return data.assigned_trip_id.filter((trip) => trip.status === statusMap[activeTab]);
  }, [data, activeTab]);

  const handleContactPress = () => contactBottomSheetRef.current?.snapToIndex(0);

  const handleCallPress = () => {
    const phoneNumber = data?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:+91${phoneNumber}`);
      contactBottomSheetRef.current?.close();
    }
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-2 text-gray-600">Loading Driver Details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1">
        <Text>Error fetching driver details</Text>
      </View>
    );
  }

  const TABS = ["Active", "Completed", "Canceled", "Issues"];

  return (
    <>
      <View className="flex-1 bg-gray-50">
        <ScrollView showsVerticalScrollIndicator={false} className="">
          <ScreenHeader onBack={() => navigation.goBack()} />
          <View className="flex-1 p-3">
            <DriverInfoCard driver={data} onCallPress={handleContactPress} />

            {!data?.assigned_trip_id || data.assigned_trip_id.length === 0 ? (
              <NoTripsAssigned />
            ) : (
              <>
                {currentTrips.map((trip) => (
                  <CurrentTripCard key={trip._id} trip={trip} navigation={navigation} />
                ))}

                <View className="mx-4 my-4 bg-white border shadow-xl border-slate-100 rounded-3xl">
                  <View className="p-4 bg-slate-50 rounded-t-2xl">
                    <View className="flex-row justify-between">
                      {TABS.map((tab) => (
                        <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} activeOpacity={0.8} style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}>
                          <Text style={[styles.tabText, activeTab === tab ? styles.activeTabText : styles.inactiveTabText]}>{tab}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="p-4">{filteredTripsByTab.length > 0 ? filteredTripsByTab.map((trip, index) => <TripItem key={trip._id} trip={trip} index={index} />) : <Text className="py-8 text-center text-gray-500">No {activeTab.toLowerCase()} trips.</Text>}</View>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </View>

      <ReusableBottomSheet ref={contactBottomSheetRef} snapPoints={["45%"]}>
        <View className="flex-1 p-6">
          <View className="items-center mb-6">
            <View className="mb-4 overflow-hidden rounded-xl">
              <LinearGradient colors={["#E0E7FF", "#C7D2FE"]} className="p-4">
                <Feather name="phone" size={28} color="#4F46E5" />
              </LinearGradient>
            </View>
            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Contact Driver</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with your driver for any updates.</Text>
          </View>

          <View className="p-4 mb-6 bg-gray-50 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <View className="p-3 mr-3 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="user" size={16} color="#6B7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">{data?.name || "Not available"}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="p-3 mr-3 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="phone" size={16} color="#6B7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">{data?.phone ? `+91 ${data.phone}` : "Not available"}</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-auto">
            <TouchableOpacity activeOpacity={0.7} onPress={() => contactBottomSheetRef.current?.close()} className="items-center justify-center flex-1 p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleCallPress} disabled={!data?.phone} className={`flex-row items-center justify-center flex-1 p-4 rounded-2xl ${!data?.phone ? "bg-gray-300" : "bg-blue-600"}`}>
              <FontAwesome6 name="phone" size={18} color={!data?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2.5 text-lg font-bold ${!data?.phone ? "text-gray-500" : "text-white"}`}>Call Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 3,
    marginHorizontal: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#000000",
  },
  inactiveTab: {
    backgroundColor: "#F3F4F6",
  },
  tabText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  inactiveTabText: {
    color: "#7F8591",
  },
});

export default DriverDetailScreen;
