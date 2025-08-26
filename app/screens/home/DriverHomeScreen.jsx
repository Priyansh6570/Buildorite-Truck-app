import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text, RefreshControl, ScrollView, TouchableOpacity, Linking, Dimensions } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useFetchMyTruck } from "../../hooks/useTruck";
import { useUpdatePushToken, usePopulateOwnerId } from "../../hooks/useUser";
import { useFetchUserTripCounts } from "../../hooks/useTrip";
import { useNavigation } from "@react-navigation/native";
import { useNotification } from "../../context/NotificationContext";
import { FontAwesome5, FontAwesome, Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
};

const formatRegNumber = (regNumber) => {
  if (!regNumber) return "";
  if (regNumber.length === 10) {
    // Format like "AB 12 CD 1234"
    return `${regNumber.slice(0, 2)} ${regNumber.slice(2, 4)} ${regNumber.slice(4, 6)} ${regNumber.slice(6)}`;
  } else if (regNumber.length === 9) {
    // Format like "23 BH 1234 AA"
    return `${regNumber.slice(0, 2)} ${regNumber.slice(2, 4)} ${regNumber.slice(4, 8)} ${regNumber.slice(8)}`;
  }
  let formatted = "";
  for (let i = 0; i < regNumber.length; i++) {
    formatted += regNumber[i];
    if ((i + 1) % 2 === 0 && i !== regNumber.length - 1) {
      formatted += " ";
    }
  }
  return formatted;
};

const HomeHeader = ({ user }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View className="shadow-sm">
      <LinearGradient colors={["#0F172A", "#1D283A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-5" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center justify-between px-2">
          <Text className="text-2xl font-bold text-white">BuildoRite</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")} className="p-2 rounded-full bg-white/10">
            <Ionicons name="person-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-2 mt-8 mb-12">
          <Text className="text-sm font-medium text-gray-300">Good {getTimeOfDay()}!</Text>
          <Text className="text-3xl font-bold leading-tight text-white">Welcome back, {user?.split(" ")[0]}</Text>
          <Text className="mt-4 text-lg font-medium text-gray-300">View trip details, update your progress, and see what's next.</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const StatCard = ({ title, value, total, icon, bgColor, color, progressColor }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <View
      className="p-4 mx-2 my-2 bg-white border border-slate-100 rounded-xl w-[45%] h-[135px]"
      style={{
        shadowColor: "#00000050",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-600">{title}</Text>
          <Text className="my-2 text-3xl font-bold text-gray-900">{value}</Text>

          <View className="w-full h-2 mt-2 bg-gray-200 rounded-full">
            <View
              className="h-2 rounded-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: progressColor,
              }}
            />
          </View>
          
          <Text 
            className="mt-1 text-sm font-semibold text-right"
            style={{ color: progressColor }}
          >
            {percentage.toFixed(0)}%
          </Text>
        </View>

        <View style={{ backgroundColor: bgColor, padding: 10, borderRadius: 8 }}>
          <FontAwesome6 name={icon} size={16} color={color} />
        </View>
      </View>
    </View>
  );
};

const StatsSection = ({ tripCounts }) => {
  const completed = tripCounts?.completedTripsCount || 0;
  const pending = tripCounts?.activeTripsCount || 0;
  const total = completed + pending;

  const statsData = [
    {
      id: 1,
      title: "Completed Trips",
      value: completed,
      total: total,
      icon: "check",
      color: "#16A34A",
      bgColor: "#f0fdf4",
      progressColor: "#16A34A",
    },
    {
      id: 2,
      title: "Pending Trips",
      value: pending,
      total: total,
      icon: "clock",
      color: "#D97706",
      bgColor: "#fffbeb",
      progressColor: "#D97706",
    },
  ];

  return (
    <View className="w-full px-2 -mt-4">
      <View className="flex-row flex-wrap justify-center">
        {statsData.map((stat) => (
          <StatCard key={stat.id} title={stat.title} value={stat.value} total={stat.total} icon={stat.icon} bgColor={stat.bgColor} color={stat.color} progressColor={stat.progressColor} />
        ))}
      </View>
    </View>
  );
};

const EmployerContactCard = ({ owner }) => {
  const handleCall = () => {
    if (owner?.phone) {
      Linking.openURL(`tel:${owner.phone}`).catch((err) => console.error("Failed to open phone dialer.", err));
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        padding: 20,
        shadowColor: "#00000050",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
      className="relative -mb-4 -top-12"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <LinearGradient
            colors={["#3B82F6", "#8B5CF6"]}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <FontAwesome5 name="building" size={20} color="white" />
          </LinearGradient>
          <View className="flex-1">
            <Text className="mb-1 text-sm font-medium text-gray-500">Employer</Text>
            <Text className="mb-1 text-lg font-bold text-gray-900">{owner?.name || "Your Employer"}</Text>
            <Text className="text-sm text-gray-600">{owner?.phone || "Phone not available"}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCall}
          style={{
            backgroundColor: "#10B981",
            width: 48,
            height: 48,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 3,
          }}
        >
          <FontAwesome5 name="phone" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const VehicleStatusCard = ({ truck }) => {
  const navigation = useNavigation();

  if (!truck) {
    return (
      <View
        style={{
          backgroundColor: "white",
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 16,
          padding: 24,
          shadowColor: "#00000050",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 3,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            backgroundColor: "#F3F4F6",
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <FontAwesome5 name="truck" size={32} color="#9CA3AF" />
        </View>
        <Text className="mb-2 text-lg font-bold text-gray-900">No Vehicle Found</Text>
        <Text className="mb-6 text-center text-gray-600">Add your vehicle details to get started with trips</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddTruck")}
          style={{
            backgroundColor: "#3B82F6",
            paddingHorizontal: 32,
            paddingVertical: 12,
            borderRadius: 12,
            elevation: 2,
          }}
        >
          <Text className="font-semibold text-center text-white">Add Vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#10B981";
      case "idle":
        return "#F59E0B";
      case "maintenance":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "play-circle";
      case "idle":
        return "pause-circle";
      case "maintenance":
        return "tools";
      default:
        return "help-circle";
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 28,
        borderRadius: 20,
        padding: 24,
        shadowColor: "#00000050",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Section Header */}
      <View className="flex-row items-center mb-6">
        <View style={{
          backgroundColor: '#F8FAFC',
          width: 48,
          height: 48,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <FontAwesome5 name="truck-moving" size={20} color="#4F46E5" />
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">Vehicle Details</Text>
          <Text className="text-sm text-gray-500">Your registered vehicle</Text>
        </View>
      </View>

      {/* Vehicle Info Card */}
      <View style={{
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16
      }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <FontAwesome5 name="truck" size={24} color="white" />
            </LinearGradient>
            <View className="flex-1">
              <Text className="mb-1 text-lg font-bold text-gray-900">{truck.name}</Text>
              <Text className="text-sm text-gray-600">Vehicle Model</Text>
            </View>
          </View>
          
          {/* Status Badge */}
          <View
            style={{
              backgroundColor: getStatusColor(truck.status),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name={getStatusIcon(truck.status)} size={12} color="white" style={{ marginRight: 6 }} />
            <Text className="text-xs font-semibold text-white">{truck.status?.toUpperCase() || "UNKNOWN"}</Text>
          </View>
        </View>

        {/* Registration Number Display */}
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 16,
          borderWidth: 2,
          borderColor: '#E5E7EB',
          alignItems: 'center'
        }}>
          <Text className="mb-2 text-sm font-medium text-gray-600">Registration Number</Text>
          <Text 
            className="text-2xl font-bold tracking-wider"
            style={{ 
              color: '#1F2937',
              fontFamily: 'monospace',
              letterSpacing: 2
            }}
          >
            {formatRegNumber(truck.registration_number).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
};

// --- Enhanced Quick Actions Container ---
const QuickActions = () => {
  const navigation = useNavigation();

  return (
    <View
      style={{
        backgroundColor: "white",
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 20,
        padding: 24,
        shadowColor: "#00000050",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Section Header */}
      <View className="flex-row items-center mb-6">
        <View style={{
          backgroundColor: '#F8FAFC',
          width: 48,
          height: 48,
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12
        }}>
          <FontAwesome5 name="bolt" size={20} color="#4F46E5" />
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">Quick Actions</Text>
          <Text className="text-sm text-gray-500">Manage your trips efficiently</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-4">
        <TouchableOpacity
          className="items-center justify-center flex-1 p-5 rounded-2xl"
          onPress={() => navigation.navigate("Trips")}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#F8FAFC',
            // borderWidth: 2,
            // borderColor: '#3B82F6',
            shadowColor: "#00000050",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View style={{
            backgroundColor: '#3B82F6',
            width: 48,
            height: 48,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <FontAwesome5 name="route" size={20} color="white" />
          </View>
          <Text className="font-semibold text-gray-900">View Trips</Text>
          <Text className="mt-1 text-xs text-gray-600">Active & completed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="items-center justify-center flex-1 p-5 rounded-2xl"
          onPress={() => navigation.navigate("TripSchedule")}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#F8FAFC',
            // borderWidth: 2,
            // borderColor: '#7C3AED',
            shadowColor: "#00000050",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <View style={{
            backgroundColor: '#7C3AED',
            width: 48,
            height: 48,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <FontAwesome5 name="calendar-alt" size={20} color="white" />
          </View>
          <Text className="font-semibold text-gray-900">View Schedule</Text>
          <Text className="mt-1 text-xs text-gray-600">Upcoming trips</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Main Driver Home Screen ---
const DriverHomeScreen = () => {
  const { expoPushToken } = useNotification();
  const updatePushToken = useUpdatePushToken();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { mutate: fetchOwner, data: ownerData, isLoading: isOwnerLoading } = usePopulateOwnerId();
  const { data: tripCountsData, isLoading: isTripCountsLoading, refetch: refetchTripCounts } = useFetchUserTripCounts();
  const {
    data: myTruck,
    isLoading: isFetchingTruck,
    refetch: refetchTruck,
  } = useFetchMyTruck({
    enabled: user?.role === "driver",
  });

  // Effects
  useEffect(() => {
    if (expoPushToken) {
      updatePushToken.mutate({ pushToken: expoPushToken });
    }
  }, [expoPushToken]);

  useEffect(() => {
    fetchOwner();
  }, [fetchOwner]);

  useEffect(() => {
    if (user?.role === "driver" && !isFetchingTruck && !myTruck) {
      navigation.navigate("AddTruck");
    }
  }, [navigation, user?.role, isFetchingTruck, myTruck]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchTruck(), refetchTripCounts(), fetchOwner()]);
    setRefreshing(false);
  }, [refetchTruck, refetchTripCounts, fetchOwner]);

  // Loading State
  if ((isFetchingTruck || isOwnerLoading || isTripCountsLoading) && !refreshing) {
    return (
      <View className="items-center justify-center flex-1" style={{ backgroundColor: "#F8FAFC" }}>
        <View
          style={{
            backgroundColor: "#0F172A",
            width: 80,
            height: 80,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <FontAwesome5 name="truck" size={32} color="white" />
        </View>
        <ActivityIndicator size="large" color="#0F172A" />
        <Text className="mt-4 text-lg font-semibold text-gray-700">Loading...</Text>
        <Text className="mt-2 text-sm text-gray-500">Preparing your trip management</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: "#F8FAFC" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0F172A"]} tintColor="#0F172A" />}>
        {/* Scrollable Header */}
        <HomeHeader user={user?.name} />

        {/* Employer Contact */}
        <EmployerContactCard owner={ownerData?.owner} />

        {/* Trip Statistics */}
        <StatsSection tripCounts={tripCountsData} />

        {/* Vehicle Status */}
        <VehicleStatusCard truck={myTruck} />

        {/* Quick Actions */}
        <QuickActions />
      </ScrollView>
    </View>
  );
};

export default DriverHomeScreen;