import React, { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Animated } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFetchMyTrips } from "../../hooks/useTrip";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const SORT_OPTIONS = { NEWEST: "Newest First", OLDEST: "Oldest First" };
const TRIP_STATUSES = { active: "Active", issue_reported: "Issue Reported", completed: "Completed", canceled: "Canceled" };
const MILESTONE_STATUSES = {
  trip_assigned: "Awaiting Start",
  trip_started: "En Route to Mine",
  arrived_at_pickup: "At Mine",
  loading_complete: "Loading Complete",
  pickup_verified: "Pickup Verified",
  en_route_to_delivery: "En Route to Delivery",
  arrived_at_delivery: "At Delivery",
  delivery_complete: "Delivery Complete",
};
const ACTIVE_STATUSES = ["active", "issue_reported"];
const PAST_STATUSES = ["completed", "canceled"];

const getScheduleDate = (trip) => trip?.request_id?.finalized_agreement?.schedule?.date;
const getLatestMilestone = (trip) => {
  if (!trip || !trip.milestone_history || trip.milestone_history.length === 0) {
    return { key: "N/A", label: "Not Available" };
  }
  const lastMilestoneKey = trip.milestone_history[trip.milestone_history.length - 1].status;
  return {
    key: lastMilestoneKey,
    label: MILESTONE_STATUSES[lastMilestoneKey] || "In Progress",
  };
};

const ScreenHeader = ({ onFilterPress }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }} className="bg-white">
      <View className="flex-row items-center justify-between p-6 pb-4">
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
          <Feather name="arrow-left" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-center text-gray-900">Truck Trips</Text>
        <TouchableOpacity onPress={onFilterPress} activeOpacity={0.8} className="overflow-hidden rounded-xl">
          <LinearGradient colors={["#212B39", "#4A5462"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-3">
            <FontAwesome6 name="filter" size={16} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: { dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700", border: "border-green-100" },
    completed: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100" },
    canceled: { dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700", border: "border-red-100" },
    issue_reported: { dot: "bg-orange-500", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100" },
  };
  const style = styles[status] || styles.completed;

  return (
    <View className={`flex-row items-center self-start px-3 py-1 mt-1 border rounded-full ${style.bg} ${style.border}`}>
      <View className={`w-2 h-2 mr-1.5 rounded-full ${style.dot}`} />
      <Text className={`text-sm font-bold capitalize ${style.text}`}>{status.replace("_", " ")}</Text>
    </View>
  );
};

const InfoBox = ({ icon, iconColor, title, value, isAnimated = false }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimated) {
      Animated.loop(Animated.sequence([Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: false }), Animated.timing(animValue, { toValue: 0, duration: 800, useNativeDriver: false })])).start();
    }
  }, [isAnimated, animValue]);

  const animatedStyle = {
    backgroundColor: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["#F9FAFB", "#FEF3C7"],
    }),
  };

  return (
    <Animated.View style={[{ width: "48%" }, isAnimated && animatedStyle]} className="p-4 bg-[#F9FAFB] rounded-xl">
      <View className="flex-row items-center">
        <FontAwesome6 name={icon} size={12} color={iconColor} />
        <Text className="ml-2 text-sm font-semibold text-gray-500">{title}</Text>
      </View>
      <Text className="mt-1 text-base font-bold text-gray-900" numberOfLines={1}>
        {value}
      </Text>
      {isAnimated && <Text className="text-xs font-semibold text-amber-600">Awaiting Verification</Text>}
    </Animated.View>
  );
};

const TripCard = ({ trip }) => {
  const navigation = useNavigation();
  const scheduleDate = getScheduleDate(trip);
  const latestMilestone = getLatestMilestone(trip);
  const isActionRequired = latestMilestone.key === "delivery_complete";

  return (
    <View className="p-6 py-8 mb-4 bg-white border shadow-md border-slate-100 rounded-3xl">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-4">
          <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
            {trip.request_id?.material_id?.name}
          </Text>
          <StatusBadge status={trip.status} />
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("TruckOwnerTripDetail", { tripId: trip._id })} className="px-4 py-2 bg-black rounded-xl">
          <Text className="font-bold text-white">Details</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap justify-between mt-4 gap-y-3">
        <InfoBox icon="calendar-days" iconColor="#3B82F6" title="Schedule" value={scheduleDate ? format(new Date(scheduleDate), "MMM d, yyyy") : "N/A"} />
        <InfoBox icon="weight-hanging" iconColor="#16A34A" title="Quantity" value={`${trip.request_id?.finalized_agreement?.quantity} ${trip.request_id?.finalized_agreement?.unit?.name || "Tons"}`} />
        <InfoBox icon="user-tie" iconColor="#F97316" title="Driver" value={trip.driver_id?.name || "N/A"} />
        <InfoBox icon="timeline" iconColor="#3B82F6" title="Milestone" value={latestMilestone.label} isAnimated={isActionRequired} />
      </View>

      <View className="px-3 pt-4 mt-4 border-t border-slate-100">
        <View className="flex-row items-center">
          <FontAwesome6 name="location-dot" size={14} color="#EF4444" />
          <Text className="mt-1 ml-2 text-sm font-semibold text-gray-500">Destination</Text>
        </View>
        <Text className="mt-1 font-semibold text-gray-800" numberOfLines={1}>
          {trip.destination?.address?.split(",")[0] || "Not available"}
        </Text>
      </View>
    </View>
  );
};

const FilterOption = ({ label, isSelected, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style} className={`flex-row items-center p-4 mb-3 border rounded-2xl ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
    <Text className={`flex-1 font-semibold text-center ${isSelected ? "text-blue-600" : "text-gray-700"}`}>{label}</Text>
  </TouchableOpacity>
);

const FilterSection = ({ title, children }) => (
  <View className="mb-6">
    <Text className="mb-4 text-lg font-bold text-gray-800">{title}</Text>
    {children}
  </View>
);

const TruckTripScreen = () => {
  const route = useRoute();
  const { data: allTrips, isLoading, isError } = useFetchMyTrips();

  const [activeTab, setActiveTab] = useState("Active Trips");
  const filterBottomSheetRef = useRef(null);

  const [filters, setFilters] = useState({ sortBy: SORT_OPTIONS.NEWEST, status: [], milestone: [] });
  const [tempFilters, setTempFilters] = useState(filters);

  const filteredAndSortedTrips = useMemo(() => {
    if (!allTrips) return [];
    let trips = activeTab === "Active Trips" ? allTrips.filter((trip) => ACTIVE_STATUSES.includes(trip.status)) : allTrips.filter((trip) => PAST_STATUSES.includes(trip.status));

    if (filters.status.length > 0) {
      trips = trips.filter((trip) => filters.status.includes(trip.status));
    }

    if (activeTab === "Active Trips" && filters.milestone.length > 0) {
      trips = trips.filter((trip) => {
        const lastMilestone = getLatestMilestone(trip).key;
        return lastMilestone && filters.milestone.includes(lastMilestone);
      });
    }

    trips.sort((a, b) => {
      const dateA = getScheduleDate(a) || a.createdAt;
      const dateB = getScheduleDate(b) || b.createdAt;
      if (filters.sortBy === SORT_OPTIONS.OLDEST) {
        return new Date(dateA) - new Date(dateB);
      }
      return new Date(dateB) - new Date(dateA);
    });
    return trips;
  }, [allTrips, activeTab, filters]);

  const openFilterSheet = () => {
    setTempFilters(filters);
    filterBottomSheetRef.current?.snapToIndex(0);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    filterBottomSheetRef.current?.close();
  };

  const resetFilters = () => {
    const initialFilters = { sortBy: SORT_OPTIONS.NEWEST, status: [], milestone: [] };
    setTempFilters(initialFilters);
    setFilters(initialFilters);
    filterBottomSheetRef.current?.close();
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
    const newFilters = { ...filters, status: [], milestone: [] };
    setFilters(newFilters);
    setTempFilters(newFilters);
  };

  const renderContent = () => {
    if (isLoading) return <ActivityIndicator size="large" color="#1f2937" className="mt-16" />;
    if (isError) return <Text className="mt-16 text-center text-red-500">Failed to load trips.</Text>;
    if (filteredAndSortedTrips.length === 0) return <Text className="mt-16 text-center text-gray-500">No trips found.</Text>;

    return (
      <View className="flex-1">
        <FlatList data={filteredAndSortedTrips} keyExtractor={(item) => item._id} renderItem={({ item }) => <TripCard trip={item} />} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false} />
      </View>
    );
  };

  const TABS = ["Active Trips", "Past Trips"];

  return (
    <View style={styles.flexOne}>
      <ScreenHeader onFilterPress={openFilterSheet} />

      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => handleTabChange(tab)} style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View className="flex-1">{renderContent()}</View>

      <ReusableBottomSheet ref={filterBottomSheetRef}>
        <View className="flex-1 p-6 bg-gray-50">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Sort & Filter</Text>
            <TouchableOpacity onPress={resetFilters} className="px-4 py-2 bg-gray-200 rounded-full">
              <Text className="font-bold text-gray-700">Reset</Text>
            </TouchableOpacity>
          </View>
          <View className="my-6 border-b border-gray-200" />
          <ScrollView showsVerticalScrollIndicator={false}>
            <FilterSection title="Sort By">
              <View className="flex-row justify-between">
                {Object.values(SORT_OPTIONS).map((option) => (
                  <FilterOption key={option} label={option} style={{ width: "48%" }} isSelected={tempFilters.sortBy === option} onPress={() => setTempFilters((prev) => ({ ...prev, sortBy: option }))} />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Trip Status">
              <View className="flex-row flex-wrap justify-between">
                {(activeTab === "Active Trips" ? ACTIVE_STATUSES : PAST_STATUSES).map((status) => (
                  <FilterOption
                    key={status}
                    label={TRIP_STATUSES[status]}
                    style={{ width: "48%" }}
                    isSelected={tempFilters.status.includes(status)}
                    onPress={() =>
                      setTempFilters((prev) => ({
                        ...prev,
                        status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status],
                      }))
                    }
                  />
                ))}
              </View>
            </FilterSection>

            {activeTab === "Active Trips" && (
              <FilterSection title="Current Milestone">
                <View className="flex-row flex-wrap justify-between">
                  {Object.entries(MILESTONE_STATUSES).map(([key, label]) => (
                    <FilterOption
                      key={key}
                      label={label}
                      style={{ width: "48%" }}
                      isSelected={tempFilters.milestone.includes(key)}
                      onPress={() =>
                        setTempFilters((prev) => ({
                          ...prev,
                          milestone: prev.milestone.includes(key) ? prev.milestone.filter((m) => m !== key) : [...prev.milestone, key],
                        }))
                      }
                    />
                  ))}
                </View>
              </FilterSection>
            )}
          </ScrollView>
          <TouchableOpacity onPress={applyFilters} className="p-4 mt-4 bg-gray-800 rounded-2xl">
            <Text className="text-lg font-bold text-center text-white">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  flexOne: { flex: 1, backgroundColor: "#F9FAFB" },
  tabContainer: {
    flexDirection: "row",
    padding: 6,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabText: {
    fontWeight: "bold",
    color: "#818992",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
});

export default TruckTripScreen;
