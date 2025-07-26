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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
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

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const handleNavigate = () => {
    navigation.navigate("MineDetail", { mineId: mine._id });
  };
  const handleMaterialsPress = (e) => {
    e.stopPropagation();
    navigation.navigate("MineDetail", {
      mineId: mine._id,
      activeTab: "materials",
    });
  };

  return (
    <TouchableOpacity
      className="mx-3 mb-6"
      activeOpacity={1}
      onPress={handleNavigate}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ transform: [{ scale: scaleValue }] }]}
    >
      <View className="relative overflow-hidden bg-white shadow-lg rounded-2xl">
        <Image
          source={{
            uri:
              mine.banner_images[0]?.url ||
              "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
          }}
          className="w-full h-72"
          style={{ resizeMode: "cover" }}
        />
        <View className="absolute flex-row justify-between top-4 left-4 right-4">
          {/* Distance Badge */}
          {loadingDistance ? (
            <View className="flex-row items-center px-3 py-2 rounded-full bg-black/70 backdrop-blur">
              <ActivityIndicator size="small" color="white" />
              <Text className="ml-2 text-sm font-medium text-white">
                Loading...
              </Text>
            </View>
          ) : distance !== null ? (
            <View className="flex-row items-center px-3 py-2 rounded-full bg-black/70 backdrop-blur">
              <Ionicons name="location" size={14} color="#10B981" />
              <Text className="ml-1 text-sm font-semibold text-white">
                {convertToIndianNumberSystem(distance)} km
              </Text>
            </View>
          ) : (
            <View />
          )}

          <View className="flex-row items-center px-3 py-2 rounded-full bg-black/70 backdrop-blur">
            <MaterialCommunityIcons
              name="clock-outline"
              size={14}
              color="#F59E0B"
            />
            <Text className="ml-1 text-sm font-medium text-white">
              {timeAgo(mine.createdAt)}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 20,
            paddingBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          {/* Mine Name */}
          <View className="flex-row justify-between mt-4 space-x-3">
            <View className="flex-col w-[70%]">
              <Text
                className="text-2xl font-bold text-white capitalize"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {mine.name}
              </Text>

              {/* Location */}
              <View className="flex-row items-center mt-2">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
                <Text
                  className="ml-1 text-sm text-white/80"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {mine.location?.address?.split(",")[0] || "Mining Location"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {mine.isPremium && (
          <View className="absolute top-4 right-4">
            <View className="flex-row items-center px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600">
              <MaterialIcons name="star" size={12} color="white" />
              <Text className="ml-1 text-xs font-bold text-white">PREMIUM</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default MineCard;