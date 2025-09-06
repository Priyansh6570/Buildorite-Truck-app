import React, { useState, useMemo, useRef } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, StyleSheet, LayoutAnimation, UIManager, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons, FontAwesome6, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFetchMyRequests } from "../../hooks/useRequest";
import RequestCard from "../../components/Request/RequestCard";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import { useNavigation } from "@react-navigation/native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SORT_OPTIONS = {
  NEWEST: "Newest First",
  OLDEST: "Oldest First",
};
const DELIVERY_METHODS = {
  DELIVERY: "Delivery",
  PICKUP: "Pickup",
};
const ACTIVE_STATUSES = ["pending", "countered", "accepted", "in_progress"];
const ARCHIVED_STATUSES = ["completed", "rejected", "canceled"];

const STATUS_LABELS = {
  pending: "Pending",
  countered: "New Response",
  accepted: "Accepted",
  in_progress: "En Route",
  completed: "Completed",
  rejected: "Rejected",
  canceled: "Canceled",
};

const RequestScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const filterBottomSheetRef = useRef(null);
  const userType = "buyer";

  const [activeTab, setActiveTab] = useState("Active");
  const [filters, setFilters] = useState({
    sortBy: SORT_OPTIONS.NEWEST,
    deliveryMethod: null,
    status: [],
  });
  const [tempFilters, setTempFilters] = useState(filters);

  const { data: allRequests = [], isLoading, isRefetching, refetch } = useFetchMyRequests();

  const filteredAndSortedRequests = useMemo(() => {
    let requests = activeTab === "Active" ? allRequests.filter((req) => ACTIVE_STATUSES.includes(req.status)) : allRequests.filter((req) => ARCHIVED_STATUSES.includes(req.status));

    if (filters.deliveryMethod) {
      requests = requests.filter((req) => req.current_proposal.delivery_method === filters.deliveryMethod.toLowerCase());
    }
    if (filters.status.length > 0) {
      requests = requests.filter((req) => filters.status.includes(req.status));
    }
    requests.sort((a, b) => {
      if (filters.sortBy === SORT_OPTIONS.OLDEST) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return requests;
  }, [allRequests, activeTab, filters]);

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setActiveTab(tab);
  };
  const openFilterSheet = () => {
    setTempFilters(filters);
    filterBottomSheetRef.current?.snapToIndex(0);
  };
  const applyFilters = () => {
    setFilters(tempFilters);
    filterBottomSheetRef.current?.close();
  };
  const resetFilters = () => {
    const initialFilters = { sortBy: SORT_OPTIONS.NEWEST, deliveryMethod: null, status: [] };
    setTempFilters(initialFilters);
    setFilters(initialFilters);
    filterBottomSheetRef.current?.close();
  };

  const renderList = ({ data, type }) => {
    if (isLoading) return <ActivityIndicator size="large" color="#1f2937" className="mt-16" />;
    if (data.length === 0) {
      return (
        <View className="items-center justify-center flex-1 mt-20">
          <MaterialCommunityIcons name="text-box-outline" size={48} color="#9ca3af" />
          <Text className="mt-4 text-lg font-bold text-gray-800">No {type} Requests</Text>
          <Text className="mt-1 text-base text-center text-gray-500">No requests found matching your filters.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={data}
        renderItem={({ item }) => <RequestCard request={item} userType={userType} />}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#1f2937" />}
      />
    );
  };

  const FilterOption = ({ label, isSelected, onPress, style }) => (
    <TouchableOpacity onPress={onPress} style={style} className={`flex-row items-center p-4 mb-3 border rounded-2xl ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"}`}>
      <Text className={`flex-1 font-semibold text-center ${isSelected ? "text-blue-600" : "text-gray-700"}`}>{label}</Text>
    </TouchableOpacity>
  );

  const FilterSection = ({ title, children, iconName, iconGradientColors }) => (
    <View className="mb-6">
      <View className="flex-row items-center mb-4">
        <View className="overflow-hidden rounded-xl">
          <LinearGradient colors={iconGradientColors} className="p-2.5 min-w-10 items-center justify-center">
            <FontAwesome6 name={iconName} size={16} solid color="white" />
          </LinearGradient>
        </View>
        <Text className="ml-3 text-lg font-bold text-gray-800">{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="flex-row items-center justify-between p-6 pb-2">
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-2 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Requests</Text>
          <TouchableOpacity onPress={openFilterSheet} activeOpacity={0.8} className="overflow-hidden rounded-xl">
            <LinearGradient colors={["#212B39", "#4A5462"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-3">
              <FontAwesome6 name="filter" size={16} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View className="flex-row p-1.5 m-4 mx-6 bg-[#F3F4F6] rounded-2xl">
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleTabChange("Active")} className="relative flex-1 p-4">
            {activeTab === "Active" && <View style={[StyleSheet.absoluteFill, styles.activeTab]} className="bg-white rounded-2xl" />}
            <Text className={`text-center font-bold text-base ${activeTab === "Active" ? "text-gray-900" : "text-gray-500"}`}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => handleTabChange("Archive")} className="relative flex-1 p-4">
            {activeTab === "Archive" && <View style={[StyleSheet.absoluteFill, styles.activeTab]} className="bg-white rounded-2xl" />}
            <Text className={`text-center font-bold text-base ${activeTab === "Archive" ? "text-gray-900" : "text-gray-500"}`}>Archive</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderList({ data: filteredAndSortedRequests, type: activeTab })}

      <ReusableBottomSheet ref={filterBottomSheetRef} snapPoints={["85%"]} backgroundStyle={{ backgroundColor: "#F9FAFB" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-gray-900">Sort & Filter</Text>
            <TouchableOpacity onPress={resetFilters} className="px-4 py-2 bg-gray-200 rounded-full">
              <Text className="font-bold text-gray-700">Reset</Text>
            </TouchableOpacity>
          </View>
          <View className="my-6 border-b border-gray-200" />

          <FlatList
            showsVerticalScrollIndicator={false}
            data={[{ key: "filters" }]}
            renderItem={() => (
              <>
                <FilterSection title="Sort By" iconName="sort" iconGradientColors={["#8B5CF6", "#A78BFA"]}>
                  <View className="flex-row justify-between">
                    {Object.values(SORT_OPTIONS).map((option) => (
                      <FilterOption key={option} label={option} style={{ width: "48%" }} isSelected={tempFilters.sortBy === option} onPress={() => setTempFilters((prev) => ({ ...prev, sortBy: option }))} />
                    ))}
                  </View>
                </FilterSection>

                <FilterSection title="Delivery Method" iconName="truck" iconGradientColors={["#EF4444", "#F87171"]}>
                  <View className="flex-row justify-between">
                    {Object.values(DELIVERY_METHODS).map((method) => (
                      <FilterOption key={method} label={method} style={{ width: "48%" }} isSelected={tempFilters.deliveryMethod === method} onPress={() => setTempFilters((prev) => ({ ...prev, deliveryMethod: prev.deliveryMethod === method ? null : method }))} />
                    ))}
                  </View>
                </FilterSection>

                <FilterSection title="Status" iconName="circle-check" iconGradientColors={["#38BDF8", "#7DD3FC"]}>
                  <View className="flex-row flex-wrap justify-between">
                    {(activeTab === "Active" ? ACTIVE_STATUSES : ARCHIVED_STATUSES).map((status) => (
                      <FilterOption
                        key={status}
                        label={STATUS_LABELS[status]}
                        style={{ width: "48%" }}
                        isSelected={tempFilters.status.includes(status)}
                        onPress={() => setTempFilters((prev) => ({ ...prev, status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status] }))}
                      />
                    ))}
                  </View>
                </FilterSection>
              </>
            )}
          />

          <TouchableOpacity onPress={applyFilters} className="p-4 mt-4 bg-gray-800 rounded-2xl">
            <Text className="text-lg font-bold text-center text-white">Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  activeTab: { elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84 },
});

export default RequestScreen;
