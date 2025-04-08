import React, { useRef } from "react";
import { TouchableOpacity, Image, View, Text, Animated } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import convertToIndianNumberSystem from "../utils/ConvertToIndianSystem";
import { useNavigation } from "@react-navigation/native";

const MaterialCard = ({ material }) => {
  const navigation = useNavigation();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handleNavitegate = () => {
    navigation.navigate("MaterialDetail", { materialId: material._id });
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const updatedTime = new Date(timestamp);
    const seconds = Math.floor((now - updatedTime) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} weeks ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months ago`;
    const years = Math.floor(days / 365);
    return `${years} years ago`;
  };
  return (
    <TouchableOpacity
      className="mx-2 mb-8 bg-white shadow-lg rounded-3xl"
      activeOpacity={1}
      onPress={handleNavitegate}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ transform: [{ scale: scaleValue }] }]}
    >
      {/* Image */}
      <View className="relative">
        <Image
          source={{
            uri:
              material.photos?.[0]?.url ||
              "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
          }}
          className="w-full h-48 rounded-t-xl"
        />
      </View>
      {/* Details */}
      <View className="p-4 mt-2">
        <Text className="mx-3 text-2xl font-bold capitalize">
          {material.name}
        </Text>
        <View className="flex-row items-center justify-between mx-4 mt-1">
          <View
            className={`px-2 py-1 mt-2 rounded-lg text-sm font-medium ${
              material.availability_status
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <Text>
              {" "}
              {material.availability_status ? "Available" : "Unavailable"}
            </Text>
          </View>
          <Text className="ml-1 text-gray-500">
            <Feather name="box" size={14} color="grey" />{" "}
            {material.stock_quantity} kg{" "}
          </Text>
        </View>
        {/* Pricing Section */}
        <View className="pt-2 mx-4 mt-3 mb-2 border-t border-gray-200">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-500">Pricing:</Text>
            <Text className="my-1 ml-1 text-sm text-gray-500">
              <Feather name="calendar" size={12} color="grey" /> Updated{" "}
              {timeAgo(material.updatedAt)}
            </Text>
          </View>
          {material.prices.map((price, index) => (
            <View
              key={`${material._id}-price-${index}`}
              className="flex-row items-center justify-between"
            >
              <Text className="my-1 text-gray-600 capitalize">
                {price.unit} :{" "}
              </Text>
              <Text className="">
                ₹{convertToIndianNumberSystem(price.price)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MaterialCard;
