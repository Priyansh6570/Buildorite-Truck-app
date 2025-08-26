import React, { useMemo, useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { Calendar } from "react-native-calendars";
import { Feather, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { format, parseISO } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useFetchMyTrips } from "../../hooks/useTrip";

const TripSchedule = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: allTrips, isLoading, isError } = useFetchMyTrips();
  const [selectedDate, setSelectedDate] = useState("");

  const getLatestMilestone = (trip) => {
    if (!trip?.milestone_history || trip?.milestone_history?.length === 0) {
      return { status: "trip_assigned", timestamp: trip?.started_at };
    }
    return trip?.milestone_history[trip?.milestone_history?.length - 1];
  };

  const categorizeTripStatus = (trip) => {
    const latestMilestone = getLatestMilestone(trip);

    if (trip?.status === "issue_reported") {
      return "issue";
    }

    if (trip?.status === "canceled") {
      return "canceled";
    }

    if (trip?.status === "completed" && latestMilestone?.status === "delivery_verified") {
      return "completed";
    }

    const activeStatuses = ["trip_started", "arrived_at_pickup", "loading_complete", "pickup_verified", "en_route_to_delivery", "arrived_at_delivery", "delivery_complete"];

    if (trip?.status === "active" && activeStatuses.includes(latestMilestone?.status)) {
      return "active";
    }

    if (latestMilestone?.status === "trip_assigned") {
      return "upcoming";
    }

    return "upcoming";
  };

  const { markedDates, stats, selectedDayTrips } = useMemo(() => {
    if (!allTrips || allTrips.length === 0) {
      return {
        markedDates: {},
        stats: { upcoming: 0, completed: 0, issues: 0, active: 0, canceled: 0 },
        selectedDayTrips: [],
      };
    }

    const marked = {};
    let upcoming = 0;
    let completed = 0;
    let issues = 0;
    let active = 0;
    let canceled = 0;

    allTrips.forEach((trip) => {
      const scheduleDate = format(parseISO(trip?.request_id?.finalized_agreement?.schedule?.date), "yyyy-MM-dd");
      const category = categorizeTripStatus(trip);

      switch (category) {
        case "upcoming":
          upcoming++;
          break;
        case "active":
          active++;
          break;
        case "completed":
          completed++;
          break;
        case "issue":
          issues++;
          break;
        case "canceled":
          canceled++;
          break;
      }

      let dayStyle = {};
      let textColor = "#FFFFFF";

      switch (category) {
        case "upcoming":
          dayStyle = { backgroundColor: "#DBEAFE", borderColor: "#93C5FD", borderWidth: 1 };
          textColor = "#1E40AF";
          break;
        case "active":
          dayStyle = { backgroundColor: "#A7F3D0", borderColor: "#6EE7B7", borderWidth: 1 };
          textColor = "#059669";
          break;
        case "completed":
          dayStyle = { backgroundColor: "#D1FAE5", borderColor: "#A7F3D0", borderWidth: 1 };
          textColor = "#047857";
          break;
        case "issue":
          dayStyle = { backgroundColor: "#FEE2E2", borderColor: "#FECACA", borderWidth: 1 };
          textColor = "#DC2626";
          break;
        case "canceled":
          dayStyle = { backgroundColor: "#F3F4F6", borderColor: "#D1D5DB", borderWidth: 1 };
          textColor = "#6B7280";
          break;
      }

      marked[scheduleDate] = {
        customStyles: {
          container: {
            ...dayStyle,
            borderRadius: 8,
          },
          text: {
            color: textColor,
            fontWeight: "600",
          },
        },
      };
    });

    const selectedTrips = selectedDate ? allTrips.filter((trip) => format(parseISO(trip?.request_id?.finalized_agreement?.schedule?.date), "yyyy-MM-dd") === selectedDate) : [];

    return {
      markedDates: marked,
      stats: { upcoming, completed, issues, active, canceled },
      selectedDayTrips: selectedTrips,
    };
  }, [allTrips, selectedDate]);

  const calendarTheme = {
    backgroundColor: "#ffffff",
    calendarBackground: "#ffffff",
    textSectionTitleColor: "#6B7280",
    selectedDayBackgroundColor: "#4F46E5",
    selectedDayTextColor: "#ffffff",
    todayTextColor: "#4F46E5",
    dayTextColor: "#1F2937",
    textDisabledColor: "#D1D5DB",
    arrowColor: "#4F46E5",
    disabledArrowColor: "#D1D5DB",
    monthTextColor: "#1F2937",
    indicatorColor: "#4F46E5",
    textDayFontFamily: "System",
    textMonthFontFamily: "System",
    textDayHeaderFontFamily: "System",
    textDayFontWeight: "500",
    textMonthFontWeight: "700",
    textDayHeaderFontWeight: "600",
    textDayFontSize: 16,
    textMonthFontSize: 20,
    textDayHeaderFontSize: 14,
  };

  const StatCard = ({ icon, count, label, color, bgColor, borderColor }) => (
    <View className={`${bgColor} ${borderColor} border rounded-xl p-4 flex-1 items-center mx-1`}>
      <View className="flex-row items-center mb-2">
        <FontAwesome6 name={icon} size={18} color={color} />
      </View>
      <Text className={`text-2xl font-bold mb-1`} style={{ color }}>
        {count}
      </Text>
      <Text className={`text-xs font-semibold text-center`} style={{ color }}>
        {label}
      </Text>
    </View>
  );

  const LegendItem = ({ bgColor, borderColor, label }) => (
    <View className="flex-row items-center mb-3">
      <View className={`w-4 h-4 ${bgColor} ${borderColor} border rounded`} />
      <Text className="ml-3 text-sm font-medium text-gray-700">{label}</Text>
    </View>
  );

  const InfoBox = ({ icon, iconColor, title, value, isAnimated = false, isOverdue = false, accentColor = null }) => {
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

    let boxStyle = "bg-gray-50";
    let textStyle = "text-gray-900";

    if (accentColor === "green") {
      boxStyle = "bg-green-50 border border-green-200";
      textStyle = "text-green-800";
    } else if (accentColor === "red" || isOverdue) {
      boxStyle = "bg-red-50 border border-red-200";
      textStyle = "text-red-800";
    } else if (accentColor === "orange") {
      boxStyle = "bg-orange-50 border border-orange-200";
      textStyle = "text-orange-800";
    } else if (accentColor === "blue") {
      boxStyle = "bg-blue-50 border border-blue-200";
      textStyle = "text-blue-800";
    }

    return (
      <Animated.View style={[{ width: "48%" }, isAnimated && animatedStyle]} className={`p-4 rounded-xl ${boxStyle}`}>
        <View className="flex-row items-center">
          <FontAwesome6 name={icon} size={12} color={iconColor} />
          <Text className="ml-2 text-sm font-semibold text-gray-500">{title}</Text>
        </View>
        <Text className={`mt-1 text-base font-bold ${textStyle}`} numberOfLines={1}>
          {value}
        </Text>
        {isAnimated && <Text className="text-xs font-semibold text-amber-600">Awaiting Verification</Text>}
      </Animated.View>
    );
  };

  const TripCard = ({ trip }) => {
    const category = categorizeTripStatus(trip);
    const latestMilestone = getLatestMilestone(trip);

    let statusInfo = {
      label: "Upcoming",
      color: "#3B82F6",
      bgColor: "bg-blue-100",
      textColor: "text-blue-700",
    };

    switch (category) {
      case "active":
        statusInfo = { label: "Active", color: "#059669", bgColor: "bg-green-100", textColor: "text-green-700" };
        break;
      case "completed":
        statusInfo = { label: "Completed", color: "#047857", bgColor: "bg-green-100", textColor: "text-green-700" };
        break;
      case "issue":
        statusInfo = { label: "Issue Reported", color: "#DC2626", bgColor: "bg-red-100", textColor: "text-red-700" };
        break;
      case "canceled":
        statusInfo = { label: "Canceled", color: "#6B7280", bgColor: "bg-gray-100", textColor: "text-gray-700" };
        break;
    }

    return (
      <TouchableOpacity activeOpacity={0.8} className="p-4 mb-3 bg-white border border-gray-200 shadow-sm rounded-xl" onPress={() => navigation.navigate("TripDetail", { tripId: trip?._id })}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="flex-1 text-lg font-bold text-gray-900" numberOfLines={1}>
            {trip?.request_id?.material_id?.name}
          </Text>
          <View className={`px-3 py-1 rounded-lg ${statusInfo.bgColor}`}>
            <Text className={`text-xs font-semibold ${statusInfo.textColor}`}>{statusInfo.label}</Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between gap-y-3">
          <InfoBox icon="calendar-days" iconColor="#3B82F6" title="Schedule" value={format(parseISO(trip?.request_id?.finalized_agreement?.schedule?.date), "MMM d, yyyy")} accentColor="blue" />
          <InfoBox icon="weight-hanging" iconColor="#16A34A" title="Quantity" value={`${trip?.request_id?.finalized_agreement?.quantity} ${trip?.request_id?.finalized_agreement?.unit?.name || "Units"}`} accentColor="green" />
        </View>

        <View className="flex-row items-center pt-3 mt-3 border-t border-gray-100">
          <FontAwesome6 name="location-dot" size={14} color="#EF4444" />
          <Text className="flex-1 ml-2 text-sm text-gray-600" numberOfLines={1}>
            {trip?.destination?.address?.split(",")[0] || "Destination not available"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View style={{ paddingTop: insets.top }} className="bg-white">
          <View className="flex-row items-center justify-between p-6 pt-4 pb-4">
            <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
              <Feather name="arrow-left" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text className="text-2xl font-extrabold text-center text-gray-900">Trip Schedule</Text>
            <View className="w-12 h-12" />
          </View>
        </View>
        <View className="items-center justify-center flex-1">
          <FontAwesome6 name="truck" size={32} color="#9CA3AF" />
          <Text className="mt-2 text-gray-500">Loading trips...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="flex-row items-center justify-between p-6 pt-4 pb-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Trip Schedule</Text>
          <View className="w-12 h-12" />
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Calendar Header - Month and Navigation */}
        <View className="mx-4 mt-4 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <Calendar
            theme={calendarTheme}
            onDayPress={(day) => {
              const newSelectedDate = day.dateString === selectedDate ? "" : day.dateString;
              setSelectedDate(newSelectedDate);
            }}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...markedDates[selectedDate],
                customStyles: {
                  container: {
                    backgroundColor: "#4F46E5",
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: "#3730A3",
                  },
                  text: {
                    color: "#FFFFFF",
                    fontWeight: "700",
                  },
                },
              },
            }}
            markingType="custom"
            hideExtraDays={true}
            firstDay={1}
            enableSwipeMonths={true}
            renderHeader={(date) => (
              <View className="flex-row items-center justify-between px-4 py-3">
                {/* <TouchableOpacity activeOpacity={0.8} onPress={() => {}}>
                  <Feather name="chevron-left" size={24} color="#4F46E5" />
                </TouchableOpacity> */}
                <Text className="text-xl font-bold text-gray-900">{format(date, "MMMM yyyy")}</Text>
                {/* <TouchableOpacity activeOpacity={0.8} onPress={() => {}}>
                  <Feather name="chevron-right" size={24} color="#4F46E5" />
                </TouchableOpacity> */}
              </View>
            )}
          />
        </View>

        {/* Stats Cards */}
        <View className="px-4 pt-4">
          <View className="flex-row mb-6">
            <StatCard icon="clock" count={stats.upcoming} label="Upcoming" color="#3B82F6" bgColor="bg-blue-50" borderColor="border-blue-200" />
            <StatCard icon="truck-moving" count={stats.active} label="Active" color="#059669" bgColor="bg-green-50" borderColor="border-green-200" />
            <StatCard icon="check-circle" count={stats.completed} label="Completed" color="#047857" bgColor="bg-emerald-50" borderColor="border-emerald-200" />
          </View>
        </View>

        {/* Legend */}
        <View className="p-4 mx-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <Text className="mb-3 text-sm font-semibold text-gray-900">Legend</Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 pr-2">
              <LegendItem bgColor="bg-blue-50" borderColor="border-blue-200" label="Upcoming Trips" />
              <LegendItem bgColor="bg-green-50" borderColor="border-green-200" label="Active Trips" />
              <LegendItem bgColor="bg-emerald-50" borderColor="border-emerald-200" label="Completed Trips" />
            </View>
            <View className="w-1/2 pl-2">
              <LegendItem bgColor="bg-red-50" borderColor="border-red-200" label="Issue Reported" />
              <LegendItem bgColor="bg-gray-50" borderColor="border-gray-200" label="Canceled Trips" />
              <LegendItem bgColor="bg-indigo-600" borderColor="border-indigo-700" label="Selected Date" />
            </View>
          </View>
        </View>

        {/* Selected Day Trips */}
        {selectedDate && selectedDayTrips.length > 0 && (
          <View className="p-4 mx-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Text className="mb-3 text-lg font-bold text-gray-900">Trips on {format(parseISO(selectedDate), "MMM d, yyyy")}</Text>
            {selectedDayTrips.map((trip) => (
              <TripCard key={trip._id} trip={trip} />
            ))}
          </View>
        )}

        {selectedDate && selectedDayTrips.length === 0 && (
          <View className="items-center p-6 mx-4 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <FontAwesome6 name="calendar-xmark" size={32} color="#9CA3AF" />
            <Text className="mt-2 text-center text-gray-500">No trips scheduled for {format(parseISO(selectedDate), "MMM d, yyyy")}</Text>
          </View>
        )}

        <View className="h-6" />
      </ScrollView>
    </View>
  );
};

export default TripSchedule;
