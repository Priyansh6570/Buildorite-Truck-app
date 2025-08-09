import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { useFetchMyDrivers } from "../../hooks/useTruck";
import { Feather, Ionicons, FontAwesome6 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const DriverCard = ({ driver, onContactPress }) => {
  const navigation = useNavigation();

  const handleViewDetails = () => {
    navigation.navigate("DriverDetail", { driverId: driver._id });
  };

  const CallButton = () => (
    <TouchableOpacity
      onPress={() => onContactPress(driver)}
      className="ml-2"
      activeOpacity={0.8}
    >
      <View className="overflow-hidden rounded-xl">
        <LinearGradient
          colors={["#2c3e50", "#000000"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="items-center justify-center p-5"
        >
          <FontAwesome6 name="phone" size={16} color="white" />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  const renderCompleteCard = () => (
    <View className="p-6 py-8 mb-2 bg-white border shadow-xl rounded-3xl border-slate-200 shadow-gray-300/30">
      <View className="flex-row items-center mb-2">
        <View className="overflow-hidden rounded-xl">
          <LinearGradient colors={["#41EC8A", "#3AF6C6"]} className="p-4">
            <FontAwesome6 name="user" size={18} solid color="white" />
          </LinearGradient>
        </View>
        <View className="flex-1 mx-4">
          <Text
            className="mb-1 text-xl font-bold text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {driver.name}
          </Text>
          <Text className="font-semibold text-gray-500 text-md">
            +91 {driver.phone}
          </Text>
        </View>
        <View className="self-start px-4 py-2 border border-green-200 rounded-full bg-green-50">
          <Text className="font-bold text-green-600 uppercase">Active</Text>
        </View>
      </View>

      <View className="flex-row items-center p-4 py-5 mt-4 bg-[#F9FAFB] border border-slate-200 rounded-xl">
        <View className="mr-1 overflow-hidden rounded-xl">
          <LinearGradient colors={["#6877E0", "#7450A9"]} className="p-4 pr-3">
            <FontAwesome6 name="truck" size={18} color="white" />
          </LinearGradient>
        </View>
        <View className="flex-1 mx-3">
          <Text className="text-sm font-medium text-gray-600">VEHICLE</Text>
          <Text
            className="text-lg font-bold text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {driver.truck.name}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-medium text-gray-600">REG. NUMBER</Text>
          <Text className="text-lg font-bold text-black">
            {driver.truck.reg}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-6">
        <TouchableOpacity
          onPress={handleViewDetails}
          activeOpacity={0.8}
          className="flex-1 p-4 bg-[#F3F4F6] border border-slate-200 rounded-2xl mr-2"
        >
          <Text className="text-lg font-bold text-center text-gray-600">
            View Details
          </Text>
        </TouchableOpacity>
        <CallButton />
      </View>
    </View>
  );

  const renderNoTruckCard = () => (
    <View className="p-6 py-8 mb-2 bg-white border border-gray-200 rounded-3xl">
      <View className="flex-row items-center mb-2">
        <View className="overflow-hidden rounded-xl">
          <LinearGradient
            colors={["#F188E0", "#F46082"]}
            className="p-4"
          >
            <FontAwesome6 name="user" solid size={18} color="white" />
        </LinearGradient></View>
        <View className="flex-1 mx-4">
          <Text
            className="mb-1 text-xl font-bold text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {driver.name}
          </Text>
          <Text className="font-semibold text-gray-500 text-md">+91 {driver.phone}</Text>
        </View>
        <View className="self-start px-4 py-2 border border-blue-200 rounded-full bg-blue-50">
          <Text className="font-bold text-blue-500 uppercase">Registered</Text>
        </View>
      </View>

      {/* Middle Section: Warning */}
      <View className="flex-row items-center p-4 mt-4 bg-[#FFFBEB] border border-[#FEF2C4] rounded-xl">
        <View className="overflow-hidden rounded-xl">
        <LinearGradient
          colors={["#FB8688", "#FDCE4F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-3 rounded-lg"
        >
          <Ionicons name="warning" size={22} color="white" />
        </LinearGradient></View>
        <View className="flex-1 mx-3">
          <Text className="text-lg font-bold text-[#92400E]">
            No Vehicle Added
          </Text>
          <Text className="text-md text-[#c7822d]">
            Driver needs to add truck details
          </Text>
        </View>
        <CallButton />
      </View>
    </View>
  );

  const renderPendingCard = () => (
    <View className="p-6 py-8 mb-2 bg-white border-2 border-gray-300 border-dashed rounded-3xl">
      <View className="flex-row items-center mb-2">
        <View className="overflow-hidden rounded-xl">
          <LinearGradient colors={["#A7D3E8", "#B9E0F1"]} className="p-4">
            <FontAwesome6 name="user" size={18} solid color="white" />
          </LinearGradient>
        </View>
        <View className="flex-1 mx-4">
          <Text
            className="mb-1 text-xl font-bold text-black"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {driver.name}
          </Text>
          <Text className="font-semibold text-gray-500 text-md">
            +91 {driver.phone}
          </Text>
        </View>
        <View className="self-start px-4 py-2 border rounded-full bg-slate-100 border-slate-200">
          <Text className="font-bold text-gray-700 uppercase">Pending </Text>
        </View>
      </View>

      <View className="flex-row items-center p-4 py-5 mt-4 bg-[#F9FAFB] border border-slate-200 rounded-xl">
        <View className="p-3 bg-[#E5E7EB] rounded-lg">
          <FontAwesome6 name="clock" solid size={22} color="#6B7280" />
        </View>
        <View className="flex-1 mx-3">
          <Text className="text-lg font-bold text-gray-800 ">
            Registration Incomplete
          </Text>
          <Text className="text-sm text-gray-500">
            Waiting for driver to complete setup
          </Text>
        </View>
        <CallButton />
      </View>
    </View>
  );

  const cardContent = () => {
    if (!driver.isRegistered) {
      return renderPendingCard();
    }
    if (driver.isRegistered && !driver.truck._id) {
      return renderNoTruckCard();
    }
    return renderCompleteCard();
  };

  return <View className="mx-4 my-2">{cardContent()}</View>;
};

const TruckScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: drivers, isLoading, error, refetch } = useFetchMyDrivers();
  console.log('Drivers data:', drivers);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState(null);
  const contactBottomSheetRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error("Failed to refresh drivers:", err);
    }
    setRefreshing(false);
  }, [refetch]);

  const handleContactPress = (driver) => {
    setSelectedDriver(driver);
    contactBottomSheetRef.current?.snapToIndex(0);
  };

  const handleCallPress = () => {
    const phoneNumber = selectedDriver?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:+91${phoneNumber}`);
      contactBottomSheetRef.current?.close();
    }
  };

  const Header = () => (
    <View
      className="flex-row items-center justify-center px-8 pb-8 bg-gray-900"
      style={{ paddingTop: insets.top + 40 }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="absolute left-8 top-12 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
      >
        <Feather name="arrow-left" size={24} color="white" />
      </TouchableOpacity>
      <Text className="-mt-4 text-3xl font-black text-white">My Drivers</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("AddDriver")}
        className="absolute right-8 top-12 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !drivers) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-100">
        <ActivityIndicator size="large" color="#1F2937" />
        <Text className="mt-2 text-gray-500">Loading Drivers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-100">
        <Text className="text-red-500">Error fetching drivers</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-100">
      <Header />
      <FlatList
        data={drivers}
        keyExtractor={(item) => item._id}
        className="px-4 pt-4"
        renderItem={({ item }) => (
          <DriverCard driver={item} onContactPress={handleContactPress} />
        )}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#1F2937"]}
            tintColor={"#1F2937"}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center mt-20">
            <FontAwesome6 name="user-slash" size={48} color="#D1D5DB" />
            <Text className="mt-4 text-xl font-bold text-gray-700">
              No Drivers Found
            </Text>
            <Text className="text-gray-500">
              Press the '+' icon to add your first driver.
            </Text>
          </View>
        }
      />

      <ReusableBottomSheet
        ref={contactBottomSheetRef}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: "#fff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <View className="flex-1 p-6">
          <View className="items-center mb-6">
            <View className="mb-4 overflow-hidden rounded-xl">
            <LinearGradient
              colors={["#E0E7FF", "#C7D2FE"]}
              className="p-4 rounded-full"
            >
              <Feather name="phone" size={28} color="#4F46E5" />
            </LinearGradient></View>
            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">
              Contact Driver
            </Text>
            <Text className="text-center text-gray-600 text-md">
              Get in touch with your driver for any updates.
            </Text>
          </View>

          <View className="p-4 mb-6 bg-gray-50 rounded-2xl">
            <View className="flex-row items-center mb-3">
              <View className="p-3 mr-3 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="user" size={16} color="#6B7280" />
              </View>
              <View className="flex-1">
                {/* <Text className="text-sm font-medium text-gray-500">
                  Driver Name
                </Text> */}
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedDriver?.name || "Not available"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="p-3 mr-3 bg-white rounded-full shadow shadow-gray-200/50">
                <Feather name="phone" size={16} color="#6B7280" />
              </View>
              <View className="flex-1">
                {/* <Text className="text-sm font-medium text-gray-500">
                  Phone Number
                </Text> */}
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedDriver?.phone
                    ? `+91 ${selectedDriver.phone}`
                    : "Not available"}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-4 mt-auto">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => contactBottomSheetRef.current?.close()}
              className="items-center justify-center flex-1 p-4 bg-gray-100 rounded-2xl"
            >
              <Text className="text-lg font-bold text-center text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCallPress}
              disabled={!selectedDriver?.phone}
              className={`flex-row items-center justify-center flex-1 p-4 rounded-2xl ${
                !selectedDriver?.phone ? "bg-gray-300" : "bg-blue-600"
              }`}
            >
              <FontAwesome6
                name="phone"
                size={18}
                color={!selectedDriver?.phone ? "#9CA3AF" : "#ffffff"}
                solid
              />
              <Text
                className={`ml-2.5 text-lg font-bold ${
                  !selectedDriver?.phone ? "text-gray-500" : "text-white"
                }`}
              >
                Call Now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

export default TruckScreen;