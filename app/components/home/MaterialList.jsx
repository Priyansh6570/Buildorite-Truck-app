import React, { useRef, useMemo } from "react";
import { TouchableOpacity, Image, View, Text, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome6,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";

const MaterialCard = ({ material, routeNav }) => {
  const navigation = useNavigation();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const statusConfig = useMemo(() => {
    const status = material.availability_status?.toLowerCase();
    switch (status) {
      case "available":
        return { text: "Available", color: "bg-green-500", isPressable: true };
      case "limited":
        return { text: "Limited", color: "bg-amber-500", isPressable: true };
      case "unavailable":
      default:
        return { text: "Unavailable", color: "bg-red-500", isPressable: false };
    }
  }, [material.availability_status]);

  const isUnavailable = !statusConfig.isPressable;

  const imageUrl =
    material.photos?.[0]?.url ||
    "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png";

  const priceList = material.prices || [];
  const firstPrice = priceList[0] || {};
  const secondPrice = priceList[1];
  const extraPriceCount = priceList.length > 2 ? priceList.length - 2 : 0;

  const formatPrice = (amount) => amount > 1000 ? `${Math.floor(amount / 1000)}K` : amount;

  const handleNavigate = () => {
    navigation.navigate(routeNav, { materialId: material._id });
  };

  const handlePressIn = () => {
    if (isUnavailable) return;
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (isUnavailable) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const updatedTime = new Date(timestamp);
    const seconds = Math.floor((now - updatedTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const iconConfigs = [
    {
      library: "FontAwesome6",
      name: "mountain",
      gradientColors: ["#f97316", "#ea580c"],
    },
    {
      library: "FontAwesome6",
      name: "gem",
      gradientColors: ["#8b5cf6", "#7c3aed"],
    },
    {
      library: "FontAwesome6",
      name: "layer-group",
      gradientColors: ["#10b981", "#059669"],
    },
    {
      library: "FontAwesome6",
      name: "cubes",
      gradientColors: ["#3b82f6", "#2563eb"],
    },
  ];

  const getRandomIcon = (materialId) => {
    const hash = materialId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return iconConfigs[Math.abs(hash) % iconConfigs.length];
  };

  const selectedIcon = getRandomIcon(material._id);

  const renderIcon = (iconConfig) => {
    const iconProps = {
      name: iconConfig.name,
      size: 20,
      color: "white",
    };
    if (iconConfig.library === "FontAwesome6") return <FontAwesome6 {...iconProps} />;
    else if (iconConfig.library === "MaterialCommunityIcons") return <MaterialCommunityIcons {...iconProps} />;
    else if (iconConfig.library === "AntDesign") return <AntDesign {...iconProps} />;
    return null;
  };

  const renderPricingBoxes = () => {
    const pricingCount = priceList.length;
    if (pricingCount === 0) return null;
    if (pricingCount > 2) {
      return (
        <View className="space-y-2">
          <View className={`px-4 py-5 mb-2 rounded-lg ${isUnavailable ? "bg-gray-300" : "bg-[#F9FAFB]"}`}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-lg font-semibold ${isUnavailable ? "text-gray-500" : "text-gray-600"}`}>per {firstPrice.unit?.name || "unit"}</Text>
              <Text className={`text-xl font-bold ${isUnavailable ? "text-gray-500" : "text-gray-800"}`}>₹{formatPrice(firstPrice.price || 0)}</Text>
            </View>
          </View>
          <View className={`px-4 py-5 mb-2 rounded-lg ${isUnavailable ? "bg-gray-300" : "bg-[#F9FAFB]"}`}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-lg font-semibold ${isUnavailable ? "text-gray-500" : "text-gray-600"}`}>per {secondPrice.unit?.name || "unit"}</Text>
              <Text className={`text-xl font-bold ${isUnavailable ? "text-gray-500" : "text-gray-800"}`}>₹{formatPrice(secondPrice.price || 0)}</Text>
            </View>
          </View>
          <View className="w-full mb-4 overflow-hidden rounded-xl">
            <LinearGradient colors={isUnavailable ? ["#9ca3af", "#9ca3af"] : ["#212B39", "#4A5462"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="p-3 py-5 rounded-lg">
              <Text className="font-medium text-center text-white">+{extraPriceCount} more pricing option{extraPriceCount > 1 ? "s" : ""}</Text>
            </LinearGradient>
          </View>
        </View>
      );
    }
    if (pricingCount === 1) {
      return (
        <View className="w-full mb-4 overflow-hidden rounded-xl">
          <LinearGradient colors={isUnavailable ? ["#9ca3af", "#9ca3af"] : ["#212B39", "#4A5462"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="p-4 py-5 rounded-lg">
            <Text className={`text-md text-center text-slate-50 ${isUnavailable ? "opacity-70" : ""}`}>{isUnavailable ? "was" : "starting from"}</Text>
            <Text className={`text-2xl text-center font-bold text-white mt-1 ${isUnavailable ? "line-through opacity-70" : ""}`}>₹{formatPrice(firstPrice.price || 0)}/{firstPrice.unit?.name || "unit"}</Text>
          </LinearGradient>
        </View>
      );
    }
    if (pricingCount === 2) {
      return (
        <View className="space-y-2">
          <View className={`px-4 py-5 mb-2 rounded-lg ${isUnavailable ? "bg-gray-300" : "bg-[#F9FAFB]"}`}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-lg font-semibold ${isUnavailable ? "text-gray-500" : "text-gray-600"}`}>per {firstPrice.unit?.name || "unit"}</Text>
              <Text className={`text-xl font-bold ${isUnavailable ? "text-gray-500" : "text-gray-800"}`}>₹{formatPrice(firstPrice.price || 0)}</Text>
            </View>
          </View>
          <View className={`px-4 py-5 mb-4 rounded-lg ${isUnavailable ? "bg-gray-300" : "bg-[#F9FAFB]"}`}>
            <View className="flex-row items-center justify-between">
              <Text className={`text-lg font-semibold ${isUnavailable ? "text-gray-500" : "text-gray-600"}`}>per {secondPrice.unit?.name || "unit"}</Text>
              <Text className={`text-xl font-bold ${isUnavailable ? "text-gray-500" : "text-gray-800"}`}>₹{formatPrice(secondPrice.price || 0)}</Text>
            </View>
          </View>
        </View>
      );
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleValue }] }}
      className="w-full px-2 mx-auto mb-6"
    >
      <TouchableOpacity
        activeOpacity={1}
        disabled={isUnavailable}
        onPress={handleNavigate}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`w-full rounded-2xl overflow-hidden shadow-lg border border-slate-50 elivation-2 ${isUnavailable ? "bg-gray-200" : "bg-white"
          }`}
      >
        {/* Image Section */}
        <View className="relative" style={{ height: 150 }}>
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            style={{
              ...(isUnavailable && {
                opacity: 0.5,
                filter: "grayscale(100%)",
              }),
            }}
          />

          {/* --- UPDATED Availability Badge --- */}
          <View className="absolute top-3 right-3">
            <View
              className={`px-3 py-1 rounded-full flex-row items-center ${statusConfig.color
                } ${isUnavailable ? "opacity-50" : ""}`}
            >
              <View className="w-2.5 h-2.5 bg-white rounded-full mr-1.5" />
              <Text className="text-sm mt-[2px] font-semibold text-white">
                {statusConfig.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-4 pt-0">
          {/* Material Name and Icon Row */}
          <View className="flex-row items-center justify-between ">
            <View className="flex-1 mt-4">
              <Text
                className={`text-xl font-bold capitalize ${isUnavailable ? "text-gray-500" : "text-gray-800"
                  }`}
              >
                {material.name}
              </Text>
              <Text
                className={`text-md font-semibold mt-1 ${isUnavailable ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                Updated {timeAgo(material.updatedAt)}
              </Text>
            </View>

            {/* Card Icon */}
            <View className="mt-2 overflow-hidden rounded-2xl">
              {isUnavailable ? (
                <View className="p-4 bg-gray-400">
                  {renderIcon(selectedIcon, true)}
                </View>
              ) : (
                <LinearGradient
                  colors={selectedIcon.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-3"
                >
                  {renderIcon(selectedIcon, false)}
                </LinearGradient>
              )}
            </View>
          </View>

          {/* Pricing Section */}
          <View className="mt-4">{renderPricingBoxes()}</View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default MaterialCard;