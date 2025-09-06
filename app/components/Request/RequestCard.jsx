import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome6 } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";

const PulseIndicator = ({ color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
      className={`w-2.5 h-2.5 ${color} rounded-full mr-3`}
    />
  );
};

const StatusChip = ({ colors, icon, text, textColor = "text-white" }) => (
  <View className="overflow-hidden shadow-sm rounded-xl">
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="flex-row items-center px-3 py-2">
      <FontAwesome6 name={icon} size={11} color="white" solid />
      <Text className={`ml-2 font-bold text-xs uppercase tracking-wide ${textColor}`}>{text}</Text>
    </LinearGradient>
  </View>
);

const RequestCard = ({ request, userType }) => {
  const navigation = useNavigation();
  const isArchived = ["completed", "rejected", "canceled"].includes(request?.status);
  const isPickup = request?.current_proposal?.delivery_method === "pickup";

  const isMyTurn = (userType === "buyer" && request?.last_updated_by === "seller") || (userType === "seller" && request?.last_updated_by === "buyer");

  const deliveryTheme = {
    gradient: isPickup ? ["#6366f1", "#8b5cf6"] : ["#10b981", "#059669"],
    bgColor: isPickup ? "bg-indigo-50" : "bg-emerald-50",
    accentColor: isPickup ? "bg-indigo-100" : "bg-emerald-100",
    textColor: isPickup ? "text-indigo-700" : "text-emerald-700",
    icon: isPickup ? "truck-fast" : "truck-fast",
    label: isPickup ? "PICKUP" : "DELIVERY",
  };

  const getStatusConfig = () => {
    switch (request?.status) {
      case "pending":
        return {
          colors: ["#f59e0b", "#d97706"],
          icon: "clock",
          text: "PENDING",
          showPulse: isMyTurn,
          pulseColor: "bg-amber-400",
        };
      case "countered":
        return {
          colors: ["#3b82f6", "#2563eb"],
          icon: "arrows-rotate",
          text: "COUNTERED",
          showPulse: isMyTurn,
          pulseColor: "bg-blue-400",
        };
      case "accepted":
        return {
          colors: ["#10b981", "#059669"],
          icon: "check-double",
          text: "ACCEPTED",
        };
      case "in_progress":
        return {
          colors: ["#f97316", "#ea580c"],
          icon: "location-dot",
          text: "IN TRANSIT",
          showPulse: true,
          pulseColor: "bg-orange-400",
        };
      case "completed":
        return {
          colors: ["#6b7280", "#4b5563"],
          icon: "circle-check",
          text: "COMPLETED",
        };
      case "rejected":
        return {
          colors: ["#ef4444", "#dc2626"],
          icon: "circle-xmark",
          text: "REJECTED",
        };
      case "canceled":
        return {
          colors: ["#ef4444", "#dc2626"],
          icon: "ban",
          text: "CANCELED",
        };
      default:
        return {
          colors: ["#6b7280", "#4b5563"],
          icon: "question",
          text: "UNKNOWN",
        };
    }
  };

  const statusConfig = getStatusConfig();

  const renderActionSection = () => {
    if (isArchived) {
      return (
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request?.updatedAt), { addSuffix: true })}</Text>
          <StatusChip {...statusConfig} />
        </View>
      );
    }

    if (isMyTurn) {
      switch (request.status) {
        case "pending":
          return (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request?.updatedAt), { addSuffix: true })}</Text>
              <StatusChip {...statusConfig} />
            </View>
          );
        case "countered":
          return (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <PulseIndicator color={statusConfig.pulseColor} />
                <Text className="text-sm font-semibold text-gray-700">New Response</Text>
              </View>
              <StatusChip colors={["#10b981", "#059669"]} icon="arrow-right" text="VIEW" />
            </View>
          );
        case "accepted":
          if (isPickup) {
            return (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <PulseIndicator color="bg-emerald-400" />
                  <Text className="text-sm font-semibold text-gray-700">Action Required</Text>
                </View>
                <StatusChip {...statusConfig} />
              </View>
            );
          } else {
            return (
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</Text>
                <StatusChip {...statusConfig} />
              </View>
            );
          }
        case "in_progress":
          return (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</Text>
              <StatusChip {...statusConfig} />
            </View>
          );
        default:
          return (
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</Text>
              <StatusChip {...statusConfig} />
            </View>
          );
      }
    } else {
      if (request.status === "countered") {
        return (
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</Text>
            <StatusChip {...statusConfig} />
          </View>
        );
      }
    }

    return (
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium tracking-wide text-gray-400 uppercase">{formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</Text>
        <StatusChip {...statusConfig} />
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => navigation.navigate("RequestDetailScreen", { requestId: request._id, userType: userType })}
      className={`mb-4 bg-white rounded-2xl shadow-sm border ${isArchived ? "border-gray-200" : "border-gray-100"} ${isMyTurn && !isArchived ? "shadow-md" : ""}`}
      style={{
        shadowColor: isMyTurn && !isArchived ? deliveryTheme.gradient[0] : "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isMyTurn && !isArchived ? 0.1 : 0.05,
        shadowRadius: 8,
        elevation: isMyTurn && !isArchived ? 3 : 1,
      }}
    >
      <View className="p-5 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View className="mr-3 overflow-hidden rounded-xl">
              <LinearGradient colors={deliveryTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center justify-center p-2.5">
                <FontAwesome6 name={deliveryTheme.icon} size={14} color="white" />
              </LinearGradient>
            </View>
            <Text className={`font-bold text-xs uppercase tracking-wider ${deliveryTheme.textColor}`}>{deliveryTheme.label}</Text>
          </View>
          {isMyTurn && !isArchived && <View className="w-3 h-3 bg-red-400 rounded-full" />}
        </View>

        <View className="mb-4">
          <Text className="mb-1 text-xl font-bold text-gray-900" numberOfLines={1}>
            {request.truck_owner_id.name}
          </Text>
          <Text className="text-base font-medium text-gray-600" numberOfLines={1}>
            {request.material_id.name}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className={`p-3 rounded-xl ${deliveryTheme.accentColor} mr-3`}>
              <FontAwesome6 name="weight-hanging" size={16} color={deliveryTheme.gradient[0]} />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-800">
                {request.current_proposal.quantity} {request.current_proposal.unit.name}
              </Text>
              <Text className="text-xs font-medium tracking-wide text-gray-500 uppercase">Quantity</Text>
            </View>
          </View>

          <View className="items-end">
            <Text className={`text-xl font-bold ${isArchived ? "text-gray-500" : "text-emerald-600"}`}>₹{request.current_proposal.price.toLocaleString("en-IN")}</Text>
            <Text className="text-xs font-medium tracking-wide text-gray-500 uppercase">Price</Text>
          </View>
        </View>
      </View>

      <View className="px-5 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">{renderActionSection()}</View>
    </TouchableOpacity>
  );
};

export default RequestCard;
