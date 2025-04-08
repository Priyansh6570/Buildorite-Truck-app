import React, { useRef, useState, useEffect } from "react";
import {
  TouchableOpacity,
  Image,
  View,
  Text,
  Animated,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import convertToIndianNumberSystem from "../utils/ConvertToIndianSystem";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";

const MineCard = ({ mine }) => {
  const navigation = useNavigation();
  const scaleValue = useRef(new Animated.Value(1)).current;
  const [distance, setDistance] = useState(null);
  const [loadingDistance, setLoadingDistance] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

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

  useEffect(() => {
    if (permissionDenied) {
      setLoadingDistance(false);
      return;
    }

    const calculateDistance = async () => {
      setLoadingDistance(true);
      try {
        const { status: existingStatus } =
          await Location.getForegroundPermissionsAsync();

        if (existingStatus === "undetermined") {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setPermissionDenied(true);
            setLoadingDistance(false);
            return;
          }
        } else if (existingStatus !== "granted") {
          setPermissionDenied(true);
          setLoadingDistance(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLon = location.coords.longitude;
        const mineLat = mine.location.coordinates[1];
        const mineLon = mine.location.coordinates[0];

        const calculatedDistance = calculateHaversineDistance(
          userLat,
          userLon,
          mineLat,
          mineLon
        );
        setDistance(calculatedDistance.toFixed(2));
      } catch (error) {
        console.error("Error calculating distance:", error);
        setDistance(null);
      } finally {
        setLoadingDistance(false);
      }
    };

    calculateDistance();
  }, [mine.location.coordinates, permissionDenied]);

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
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

  const handleNavitegate = () => {
    navigation.navigate("MineDetail", { mineId: mine._id });
    setLoadingDistance(false);
  }

  return (
    <TouchableOpacity
      className="mx-2 mb-8 bg-white shadow-xl rounded-3xl"
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
              mine.banner_images[0]?.url ||
              "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
          }}
          className="w-full h-40 rounded-t-xl"
        />
        {loadingDistance ? (
          <View className="absolute flex-row items-center px-2 py-1 bg-black rounded-lg bottom-2 right-2">
            <ActivityIndicator size="small" color="white" />
          </View>
        ) : distance !== null ? (
          <View className="absolute flex-row items-center px-2 py-1 bg-black rounded-lg bottom-2 right-2">
            <Text className="ml-1 text-xs text-white">
              {convertToIndianNumberSystem(distance)} km
            </Text>
          </View>
        ) : null}
      </View>
      {/* Details */}
      <View className="p-4 my-4 mt-4">
        <View className="flex-row items-center justify-between mx-3 mt-1 text-gray-600">
          <Text className="mb-4 text-2xl font-bold capitalize ">
            {mine.name}
          </Text>
          <Text className="mb-2 ml-1 text-sm text-gray-500">
            <MaterialCommunityIcons
              name="clock-outline"
              size={12}
              color="grey"
            />{" "}
            {timeAgo(mine.createdAt)}
          </Text>
        </View>
        <View className="pt-2 mx-4 mt-3 mb-2 border-t border-gray-200"></View>
        <View className="flex-row mx-3 mt-1 text-gray-600">
          <Ionicons name="location-outline" size={16} color="grey" />
          <Text className="ml-1 text-sm text-gray-500 h-fit">
            {mine.location?.address}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MineCard;
