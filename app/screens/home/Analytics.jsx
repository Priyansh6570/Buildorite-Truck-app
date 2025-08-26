import React, { useState, useRef, useMemo, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from "react-native-reanimated";

// Hooks and NEW Components
import { useFetchTruckOwnerAnalytics } from "../../hooks/useTrip";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import SpendLineChart from "../../components/analytics/SpendLineChart"; // New
import OrdersBarChart from "../../components/analytics/OrdersBarChart"; // Reused
import DeliveryModePieChart from "../../components/analytics/DeliveryModePieChart"; // New

// Helper for currency formatting
const formatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

// Reusable Info Card Component
const InfoCard = ({ icon, mainText, subText, footerText, onPress, bgColor }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ backgroundColor: bgColor }} className="w-[48%] p-4 rounded-2xl shadow-lg shadow-gray-400 mb-4">
    <View className="flex-row items-start justify-between">
      <FontAwesome6 name={icon} size={20} color="white" solid />
      <FontAwesome6 name="chevron-right" size={12} color="#e5e7eb" />
    </View>
    <View className="mt-5">
      <Text className="text-3xl font-bold text-white">{mainText}</Text>
      <Text className="mt-1 text-sm font-medium text-gray-200">{subText}</Text>
      <Text className="mt-2 text-xs text-gray-300">{footerText}</Text>
    </View>
  </TouchableOpacity>
);

// Animated Refetch Icon
const AnimatedFeather = Animated.createAnimatedComponent(Feather);

// Main Analytics Screen Component
const Analytics = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [startDate, setStartDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useFetchTruckOwnerAnalytics(format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd"));

  // Refs for Bottom Sheets
  const spendSheetRef = useRef(null);
  const ordersSheetRef = useRef(null);
  const logisticsSheetRef = useRef(null);
  const durationSheetRef = useRef(null);

  // Animation for refetch button
  const rotation = useSharedValue(0);
  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    if (isRefetching) {
      rotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1);
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [isRefetching]);

  const onDateChange = (event, selectedDate, isStartDate) => {
    if (isStartDate) {
      setShowStartDatePicker(false);
      if (selectedDate) setStartDate(selectedDate);
    } else {
      setShowEndDatePicker(false);
      if (selectedDate) setEndDate(selectedDate);
    }
  };

  const totalOrders = useMemo(() => {
    if (!data?.ordersByMonth) return 0;
    return Object.values(data.ordersByMonth).reduce((sum, count) => sum + count, 0);
  }, [data]);

  const avgSpendPerOrder = useMemo(() => {
    if (!data?.spendBreakdown?.totalSpend || !totalOrders) return 0;
    return data.spendBreakdown.totalSpend / totalOrders;
  }, [data, totalOrders]);

  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <ActivityIndicator size="large" color="#3579F3" />
        <Text className="mt-3 text-lg font-semibold text-gray-700">Loading Analytics...</Text>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="items-center justify-center flex-1 px-4 bg-gray-50">
        <Ionicons name="cloud-offline-outline" size={64} color="#ef4444" />
        <Text className="mt-2 text-xl font-bold text-center text-red-600">Failed to load analytics</Text>
        <Text className="text-center text-gray-500">Please check your connection and try again.</Text>
        <TouchableOpacity onPress={() => refetch()} activeOpacity={0.8} className="flex-row items-center px-6 py-3 mt-6 bg-blue-600 rounded-full">
          <Feather name="refresh-cw" size={16} color="white" />
          <Text className="ml-2 font-bold text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ paddingTop: insets.top }} className="pb-4 bg-white shadow-lg">
            <View className="flex-row items-center justify-between p-6 pb-4">
              <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
                <Feather name="arrow-left" size={24} color="#1f2937" />
              </TouchableOpacity>
              <Text className="text-2xl font-extrabold text-center text-gray-900">Analytics</Text>
              <TouchableOpacity onPress={() => !isRefetching && refetch()} activeOpacity={0.8} className="overflow-hidden rounded-xl">
                <LinearGradient colors={["#212B39", "#4A5462"]} className="p-3">
                  <AnimatedFeather name="rotate-cw" size={18} color="white" style={animatedStyles} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Date Picker Section */}
            <View className="p-4 mx-6 bg-[#F9FAFB] rounded-xl">
              <View className="flex-row mb-3">
                <View className="flex-1 mr-2">
                  <Text className="mb-2 text-sm text-gray-500">From</Text>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(true)} className="flex-row items-center justify-between w-full px-4 py-3 bg-white border rounded-lg border-slate-200">
                    <Text className="font-semibold text-gray-800 text-md">{format(startDate, "dd MMM, yyyy")}</Text>
                    <FontAwesome6 name="calendar" size={14} color="#000000" />
                  </TouchableOpacity>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="mb-2 text-sm text-gray-500">To</Text>
                  <TouchableOpacity onPress={() => setShowEndDatePicker(true)} className="flex-row items-center justify-between w-full px-4 py-3 bg-white border rounded-lg border-slate-200">
                    <Text className="font-semibold text-gray-800 text-md">{format(endDate, "dd MMM, yyyy")}</Text>
                    <FontAwesome6 name="calendar" size={14} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-center text-gray-600 text-md">
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </Text>
            </View>
          </View>

          <View className="p-6">
            {/* Quick Info Cards */}
            <View className="flex-row flex-wrap justify-between">
              <InfoCard bgColor="#3579F3" icon="indian-rupee-sign" mainText={formatter.format(data.spendBreakdown?.totalSpend || 0).replace("₹", "₹ ")} subText="Total Spend" footerText="View Breakdown" onPress={() => spendSheetRef.current?.snapToIndex(0)} />
              <InfoCard bgColor="#19AC4F" icon="clipboard-list" mainText={totalOrders} subText="Orders Placed" footerText="View by status" onPress={() => ordersSheetRef.current?.snapToIndex(0)} />
              <InfoCard bgColor="#A048F2" icon="truck" mainText={data.logisticsEfficiency.totalTrips} subText="Total Trips" footerText="On-time vs. Delayed" onPress={() => logisticsSheetRef.current?.snapToIndex(0)} />
              <InfoCard bgColor="#F46A13" icon="receipt" mainText={formatter.format(avgSpendPerOrder || 0).replace("₹", "₹ ")} subText="Avg Spend / Order" footerText="For all placed orders" />
            </View>
            {/* Charts Section */}
            <View className="flex-col gap-6 mt-4">
              <SpendLineChart spendByMonth={data.spendByMonth} />
              <OrdersBarChart ordersByMonth={data.ordersByMonth} />
              <DeliveryModePieChart deliveryMethodBreakdown={data.deliveryMethodBreakdown} />
            </View>
            {/* Top Procured Materials */}
            <View className="mt-10">
              <Text className="mb-4 text-xl font-bold text-gray-900">Top Procured Materials</Text>
              <FlatList
                data={data.topProcuredMaterials}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 2, paddingVertical: 8 }}
                keyExtractor={(item) => item.name}
                ItemSeparatorComponent={() => <View className="w-4" />}
                renderItem={({ item, index }) => {
                  const colors = ["#3b82f6", "#16a34a", "#f97316", "#a855f7", "#ef4444"];
                  const bgColors = ["#eff6ff", "#f0fdf4", "#fff7ed", "#faf5ff", "#fee2e2"];
                  const color = colors[index % colors.length];
                  const bgColor = bgColors[index % bgColors.length];

                  return (
                    <View className="p-5 bg-white shadow-lg w-52 shadow-gray-400 rounded-2xl">
                      {/* Header with Rank Badge */}
                      <View className="flex-row items-center justify-between mb-4">
                        <View style={{ backgroundColor: bgColor }} className="px-3 py-1 rounded-lg">
                          <Text style={{ color }} className="p-1 text-xl font-bold">
                            #{index + 1}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: bgColor }} className="p-3 rounded-xl">
                          <FontAwesome6 name="cube" size={18} color={color} />
                        </View>
                      </View>

                      {/* Material Name */}
                      <Text className="mb-2 text-lg font-bold text-gray-900" numberOfLines={2}>
                        {item.name}
                      </Text>

                      {/* Stats */}
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-2xl font-extrabold" style={{ color }}>
                            {item.count}
                          </Text>
                          <Text className="text-xs font-medium text-gray-500">{item.count > 1 ? "Orders" : "Order"}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-xs text-gray-400">Most Popular</Text>
                          <View className="flex-row items-center mt-1">
                            <FontAwesome6 name="arrow-trend-up" size={12} color={color} />
                            <Text style={{ color }} className="ml-1 text-xs font-semibold">
                              Material
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            </View>
            <View className="mt-10">
              <Text className="mb-4 text-xl font-bold text-gray-900">Top Suppliers (Mines)</Text>
              <View>
                {data.topSuppliers.map((item, index) => {
                  const colors = ["#d97706", "#16a34a", "#2563eb", "#a855f7", "#ef4444"];
                  const bgColors = ["#fef3c7", "#dcfce7", "#dbeafe", "#f3e8ff", "#fee2e2"];
                  const color = colors[index % colors.length];
                  const bgColor = bgColors[index % bgColors.length];

                  return (
                    <View key={index} className="flex-row items-center p-5 mb-4 bg-white shadow-lg shadow-gray-400 rounded-2xl">
                      {/* Rank and Icon */}
                      <View className="items-center mr-4">
                        <View style={{ backgroundColor: bgColor, borderColor: "white" }} className="items-center justify-center mb-2 border-2 w-14 h-14 rounded-2xl">
                          <FontAwesome6 name="mountain" size={22} color={color} />
                        </View>
                        {/* <View style={{ backgroundColor: color }} className="px-2 py-1 rounded-full">
                          <Text className="text-xs font-bold text-white">#{index + 1}</Text>
                        </View> */}
                      </View>

                      {/* Supplier Details */}
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="flex-1 text-lg font-bold text-gray-900" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <View className="flex-col items-center">
                            <Text className="text-2xl font-extrabold" style={{ color }}>
                              {item.count}
                            </Text>
                            <Text className="text-xs font-medium text-gray-500">Orders</Text>
                          </View>
                        </View>

                          {/* <View className="flex-row items-center mb-2">
                            <FontAwesome6 name="certificate" size={12} color="#16a34a" />
                            <Text className="ml-1 text-sm text-gray-600">Verified Mining Partner</Text>
                          </View> */}
                        <View className="flex-row items-center justify-between">
                          {/* <View className="flex-row items-center">
                            <FontAwesome6 name="star" size={12} color="#f59e0b" />
                            <Text className="ml-1 text-xs text-gray-500">Top Supplier</Text>
                          </View> */}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => durationSheetRef.current?.snapToIndex(0)} className="p-6 mb-4 bg-white shadow-lg shadow-gray-400 rounded-2xl">
              <View className="flex-row items-center justify-between mb-4">
                <View className="items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                  <FontAwesome6 name="clock" size={20} color="#a855f7" />
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#9ca3af" />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-600">Average Trip Duration</Text>
                <Text className="mt-1 text-3xl font-bold text-gray-900">{data.logisticsEfficiency.avgTripDurationHours.toFixed(1)} hrs</Text>
                <Text className="mt-3 text-xs text-gray-500">Based on {data.logisticsEfficiency.totalTrips} completed trips</Text>
                <Text className="text-xs font-medium text-purple-600">Tap to see milestone breakdown →</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Date Time Pickers (Modal) */}
          {showStartDatePicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, true)} maximumDate={endDate} />}
          {showEndDatePicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={(e, d) => onDateChange(e, d, false)} minimumDate={startDate} maximumDate={new Date()} />}
        </ScrollView>
      </View>
      {/* --- Bottom Sheets --- */}
      <ReusableBottomSheet ref={spendSheetRef}>
        <BottomSheetContentWrapper title="Spend Breakdown" onClose={() => spendSheetRef.current?.close()}>
          <View className="px-4">
            <SummaryCard title="Total Spend" value={formatter.format(data.spendBreakdown.totalSpend)} bgColor="#eff6ff" textColor="#1e3a8a" />
            <View className="flex-row justify-between mt-4">
              <SummaryCard title="On Materials" value={formatter.format(data.spendBreakdown.materialSpend)} bgColor="#f0fdf4" textColor="#15803d" />
              <SummaryCard title="On Delivery" value={formatter.format(data.spendBreakdown.deliverySpend)} bgColor="#fffbeb" textColor="#b45309" />
            </View>
          </View>
        </BottomSheetContentWrapper>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={ordersSheetRef}>
        <BottomSheetContentWrapper title="Order Status Details" onClose={() => ordersSheetRef.current?.close()}>
          <View className="px-4">
            {Object.entries(data.requestStatusCounts).map(([status, count]) => (
              <OrderStatusItem key={status} status={status} count={count} />
            ))}
          </View>
        </BottomSheetContentWrapper>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={logisticsSheetRef}>
        <BottomSheetContentWrapper title="Logistics Metrics" onClose={() => logisticsSheetRef.current?.close()}>
          <View className="flex-row justify-between px-4">
            <SummaryCard icon="check-circle" iconColor="#16a34a" title="On-Time Rate" value={`${data.logisticsEfficiency.onTimeRate}%`} bgColor="#f0fdf4" textColor="#15803d" />
            <SummaryCard icon="clock" iconColor="#f97316" title="Delayed Trips" value={data.logisticsEfficiency.delayedTripsCount} bgColor="#fff7ed" textColor="#c2410c" />
          </View>
        </BottomSheetContentWrapper>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={durationSheetRef}>
        <BottomSheetContentWrapper title="Avg. Milestone Duration" onClose={() => durationSheetRef.current?.close()}>
          <View className="px-4 pb-6">
            <Text className="mb-20 text-center text-gray-600">Average time between key trip stages.</Text>

            {/* Milestone Items */}
            {Object.entries(data.logisticsEfficiency.milestoneAverages).map(([milestone, duration], index) => (
              <MilestoneItem key={milestone} milestone={milestone} duration={duration} index={index} />
            ))}
          </View>
        </BottomSheetContentWrapper>
      </ReusableBottomSheet>
    </View>
  );
};

// --- Helper & Sub-Components (largely reused) ---

const BottomSheetContentWrapper = ({ title, onClose, children }) => (
  <View className="flex-1 bg-gray-50">
    <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>
      <TouchableOpacity onPress={onClose} activeOpacity={0.8} className="p-3 bg-gray-100 rounded-xl">
        <FontAwesome6 name="xmark" size={18} color="#374151" />
      </TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={{ paddingVertical: 16, paddingBottom: 40 }}>{children}</ScrollView>
  </View>
);

const SummaryCard = ({ title, value, bgColor, textColor, icon, iconColor }) => (
  <View style={{ backgroundColor: bgColor }} className="items-center justify-center flex-1 p-4 mx-1 border border-gray-200/50 rounded-2xl">
    {icon && <FontAwesome6 name={icon} size={24} color={iconColor} style={{ marginBottom: 8 }} />}
    <Text style={{ color: textColor }} className="text-sm font-semibold text-center">
      {title}
    </Text>
    <Text style={{ color: textColor }} className="mt-1 text-2xl font-bold">
      {value}
    </Text>
  </View>
);

const OrderStatusItem = ({ status, count }) => {
  const statusConfig = {
    pending: { icon: "hourglass-half", color: "#f97316", bg: "#fff7ed" },
    accepted: { icon: "check", color: "#16a34a", bg: "#f0fdf4" },
    in_progress: { icon: "truck-fast", color: "#2563eb", bg: "#eff6ff" },
    completed: { icon: "check-double", color: "#16a34a", bg: "#dcfce7" },
    rejected: { icon: "times", color: "#dc2626", bg: "#fee2e2" },
    canceled: { icon: "ban", color: "#71717a", bg: "#f4f4f5" },
    countered: { icon: "exchange-alt", color: "#f59e0b", bg: "#fefce8" },
    default: { icon: "question-circle", color: "#6b7280", bg: "#f3f4f6" },
  };
  const config = statusConfig[status] || statusConfig.default;

  return (
    <View style={{ backgroundColor: config.bg }} className="flex-row items-center p-3 my-1 rounded-xl">
      <View style={{ backgroundColor: config.color }} className="items-center justify-center w-8 h-8 rounded-full">
        <FontAwesome6 name={config.icon} size={14} color="white" />
      </View>
      <Text className="flex-1 ml-4 text-base font-semibold text-gray-800 capitalize">{status.replace("_", " ")}</Text>
      <Text style={{ color: config.color }} className="text-lg font-bold">
        {count}
      </Text>
    </View>
  );
};
const MilestoneItem = ({ milestone, duration, index }) => {
  const [start, end] = milestone.split("→").map((s) => s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()));
  const colors = ["#3b82f6", "#16a34a", "#f97316", "#a855f7", "#ef4444", "#14b8a6", "#6366f1"];
  const color = colors[index % colors.length];

  return (
    <View className="flex-row items-center my-2">
      {/* Timeline Indicator */}
      <View className="items-center mr-4">
        <View style={{ backgroundColor: `${color}20`, borderColor: color }} className="items-center justify-center w-12 h-12 border-2 rounded-full">
          <FontAwesome6 name="flag-checkered" size={16} color={color} />
        </View>
        {index < 6 && <View style={{ backgroundColor: "#cbd5e1" }} className="w-0.5 h-8 mt-2" />}
      </View>

      {/* Milestone Details */}
      <View className="flex-1 p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
        <Text className="text-sm font-semibold text-gray-800" style={{ color }}>
          {start}
        </Text>
        <View className="flex-row items-center my-1">
          <Ionicons name="arrow-down" size={14} color="#9ca3af" />
          <View style={{ backgroundColor: "#e5e7eb" }} className="flex-1 h-px ml-2" />
        </View>
        <Text className="text-sm font-semibold text-gray-800" style={{ color }}>
          {end}
        </Text>
      </View>

      {/* Duration Display */}
      <View className="items-center justify-center w-20 p-3 ml-4 border border-gray-200 bg-gray-50 rounded-xl">
        <Text className="text-lg font-bold text-gray-800">{duration.toFixed(1)}</Text>
        <Text className="text-xs font-medium text-gray-500">hours</Text>
      </View>
    </View>
  );
};

export default Analytics;
