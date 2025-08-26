import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, RefreshControl, Dimensions, Linking, Alert } from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialDesignIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useFetchMineById } from "../../hooks/useMine";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import LocationComponent from "../../components/Ui/LocationComponent";
import Toast from "react-native-toast-message";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ShareComponent from "../../components/utils/ShareComponent"; 

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const { width: screenWidth } = Dimensions.get("window");

const MineDetail = ({ route }) => {
  const { mineId } = route.params;
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();
  const { data: mine, isLoading, error, refetch } = useFetchMineById(mineId);

  const [refreshing, setRefreshing] = useState(false);
  const contactBottomSheetRef = useRef(null);
  const directionBottomSheetRef = useRef(null);
  const shareSheetRef = useRef(null);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSharePress = () => {
    if (shareSheetRef.current) {
      shareSheetRef.current.open();
    }
  };

  const handleDirectionsPress = () => {
    directionBottomSheetRef.current?.snapToIndex(0);
  };

  const handleContactPress = () => {
    contactBottomSheetRef.current?.snapToIndex(0);
  };

  const handleCallPress = () => {
    const phoneNumber = mine?.owner_id?.phone;
    if (phoneNumber) {
      Alert.alert("Call Mine Owner", `Do you want to call ${mine?.owner_id?.name || "mine owner"}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber}`);
            contactBottomSheetRef.current?.close();
          },
        },
      ]);
    }
  };

  const daysOfWeek = [
    { label: "Monday", short: "Mon", value: "monday" },
    { label: "Tuesday", short: "Tue", value: "tuesday" },
    { label: "Wednesday", short: "Wed", value: "wednesday" },
    { label: "Thursday", short: "Thu", value: "thursday" },
    { label: "Friday", short: "Fri", value: "friday" },
    { label: "Saturday", short: "Sat", value: "saturday" },
    { label: "Sunday", short: "Sun", value: "sunday" },
  ];

  const to24HourFormat = (t) => {
    if (!t) return "00:00:00";
    const clean = t.replace(/\u202F/g, " ").replace(/[^\x00-\x7F]/g, "").trim().toLowerCase();
    const timeParts = clean.match(/(\d+):(\d+)\s*(am|pm)/);
    if (!timeParts) return "00:00:00";
    let [_, hour, minute, period] = timeParts;
    let h = parseInt(hour, 10);
    if (period === "pm" && h !== 12) h += 12;
    if (period === "am" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  };

  const timeToMs = (timeStr) => {
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 3600000 + m * 60000 + s * 1000;
  };

  const getCurrentStatus = () => {
    if (!mine) return { status: "Loading...", subtitle: "", color: "#6B7280" };
    const now = dayjs();
    const currentDay = now.format("dddd").toLowerCase();
    const todaySchedule = mine.operational_hours?.[currentDay];

    if (!todaySchedule?.open || !todaySchedule?.close) {
      return { status: "Closed", subtitle: "Holiday today", color: "#EF4444" };
    }

    const { open, close } = todaySchedule;
    const currentMs = now.hour() * 3600000 + now.minute() * 60000 + now.second() * 1000;
    const openTimeMs = timeToMs(to24HourFormat(open));
    const closeTimeMs = timeToMs(to24HourFormat(close));
    const isOpen = currentMs >= openTimeMs && currentMs <= closeTimeMs;

    if (isOpen) {
      return { status: "Open Today", subtitle: `Closes at ${close}`, color: "#10B981" };
    } else {
      return { status: "Closed", subtitle: `Opens at ${open}`, color: "#EF4444" };
    }
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
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <ActivityIndicator size="large" color="#1F2937" />
        <Text className="mt-4 text-gray-600">Loading mine details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <View className="items-center p-8">
          <Feather name="alert-triangle" size={48} color="#EF4444" />
          <Text className="mb-2 text-lg font-semibold text-gray-800">Failed to load mine data</Text>
          <TouchableOpacity onPress={onRefresh} className="px-6 py-3 mt-4 bg-gray-800 rounded-lg">
            <Text className="font-semibold text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const status = getCurrentStatus();
  const materials = mine?.materials || [];
  const bannerImages = mine?.banner_images?.length
    ? mine.banner_images
    : [{ url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" }];

  const materialIcons = [
    { icon: "mountain", color: "#F97316" },
    { icon: "cubes", color: "#374151" },
    { icon: "gem", color: "#D97706" },
  ];
  
  const shareData = {
    path: `mine/${mine?._id}`,
    app: "truck",
    name: mine?.name,
    imageUrl: mine?.banner_images?.[0]?.url,
    location: mine?.location?.address?.split(",").slice(0, 2).join(", "),
    ownerName: mine?.owner_id?.name,
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-[#111827] px-4 py-3" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="pr-12 mx-auto text-3xl font-black text-center text-white">Mine</Text>
        </View>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} showsVerticalScrollIndicator={false} className="flex-1">
        <View className="relative">
          <Carousel
            data={bannerImages}
            renderItem={({ item }) => <Image source={{ uri: item.url }} className="w-full h-96" style={{ resizeMode: "cover" }} />}
            sliderWidth={screenWidth}
            itemWidth={screenWidth}
            loop={true}
            autoplay={true}
          />
          <View className="absolute z-10 bottom-4 right-4">
            <View className="flex-row items-center px-4 py-1 rounded-full" style={{ backgroundColor: status.color }}>
              <View className="w-3 h-3 mr-2 bg-white rounded-full" />
              <Text className="font-semibold text-white text-md">{status.status}</Text>
            </View>
          </View>
        </View>

        <View className="flex-1 bg-white">
          <View className="p-6">
            <View className="my-4">
              <Text className="mb-2 text-3xl font-bold text-gray-900 capitalize">{mine?.name || "Mine Name"}</Text>
              <View className="flex-row items-center">
                <FontAwesome6 name="location-dot" size={18} color="#2563eb" />
                <Text className="ml-2 text-[16px] text-ellipsis font-semibold text-gray-700" numberOfLines={1}>
                  {mine?.location?.address?.split(",").slice(0, 2).join(", ") || "Location not available"}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between mt-2 mb-8">
              <TouchableOpacity onPress={handleContactPress} className="items-center" activeOpacity={0.9}>
                <View className="px-10 py-6 bg-[#EEF2FF] rounded-2xl">
                  <View className="p-3 bg-blue-600 rounded-full"><Ionicons name="call" size={20} color="white" /></View>
                  <Text className="mt-2 text-base font-semibold text-center text-blue-600">Call</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity className="items-center" activeOpacity={0.9} onPress={handleDirectionsPress}>
                <View className="px-8 py-6 bg-[#F0FDF4] rounded-2xl">
                  <View className="p-4 mx-auto bg-green-600 rounded-full"><FontAwesome5 name="location-arrow" size={13} color="white" /></View>
                  <Text className="mt-2 text-base font-semibold text-green-600">Directions</Text>
                </View>
              </TouchableOpacity>
              
              {/* --- UPDATED: This is now just the button that triggers the sheet --- */}
              <TouchableOpacity className="items-center" activeOpacity={0.9} onPress={handleSharePress}>
                <View className="flex-col p-6 px-6 bg-[#f8efff] rounded-2xl">
                    <View className="flex items-center justify-center px-3 py-3 mx-auto bg-purple-600 rounded-full">
                        <MaterialDesignIcons name="share-variant" size={20} color="white" />
                    </View>
                    <Text className="mt-2 text-base font-semibold text-purple-600">Share Mine</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className="px-6 py-4 mb-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="mb-4 text-xl font-bold text-gray-900">Current Status</Text>
                  <Text className="text-xl font-bold " style={{ color: status.color }}>
                    {status.status}
                  </Text>
                </View>
                <View className="w-4 h-4 mt-2 rounded-full" style={{ backgroundColor: status.color }} />
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xl text-gray-600 font-[600]">{status.subtitle}</Text>
                <Text className="pt-2 font-semibold text-indigo-600 text-md">View Schedule</Text>
              </View>
            </View>

            {/* Mine Information */}
            <View className="p-6 mb-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <Text className="mb-5 text-xl font-bold text-gray-900">Mine Information</Text>
              <View className="flex gap-4 space-y-4">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold text-gray-600">Owner</Text>
                  <Text className="font-semibold text-black text-md">{mine?.owner_id?.name || "John Mitchell"}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold text-gray-600">Mine Name</Text>
                  <Text className="font-semibold text-black text-md">{mine?.name || "Mine Name"}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-lg font-semibold text-gray-600">Updated</Text>
                  <Text className="font-semibold text-black text-md">{mine?.updatedAt ? timeAgo(mine?.updatedAt) : "2 days ago"}</Text>
                </View>
              </View>
            </View>

            {/* Available Materials */}
            <View className="p-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-xl font-bold text-gray-900">Available Materials</Text>
                <View className="px-3 pt-1 bg-blue-100 rounded-full pb-[2px]">
                  <Text className="font-semibold text-blue-600 text-md">{materials.length} Materials</Text>
                </View>
              </View>

              {materials.length === 0 ? (
                <View className="items-center py-8">
                  <View className="p-6 mb-4 bg-gray-200 rounded-2xl">
                    <FontAwesome6 name="box-open" size={24} color="#6B7280" solid />
                  </View>
                  <Text className="mb-2 text-lg font-semibold text-gray-800">No Materials Found</Text>
                  <Text className="text-sm text-center text-gray-500">There are currently no materials listed for this mine.</Text>
                </View>
              ) : (
                <>
                  <View className="flex-row justify-start gap-4 mb-6">
                    {materials.slice(0, 3).map((material, index) => (
                      <View key={material._id} className="items-center">
                        <View className="p-4 bg-slate-50 rounded-2xl w-[104px]">
                          <View
                            className="p-3 mx-auto rounded-xl"
                            style={{
                              backgroundColor: materialIcons[index]?.color,
                            }}
                          >
                            <FontAwesome6 name={materialIcons[index]?.icon} size={16} color="#ffffff" solid />
                          </View>
                          <Text className="mt-3 text-sm font-medium text-center text-black text-ellipsis" numberOfLines={1}>
                            {material.name}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("MineMaterials", {
                        mineId: mine?._id,
                      })
                    }
                    activeOpacity={0.8}
                    className="w-full py-4 bg-blue-50 rounded-xl"
                  >
                    <View className="flex-row items-center justify-center">
                      <Text className="text-lg font-semibold text-blue-700">View All Materials</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Operating Hours */}
            <View className="p-2 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <View className="p-4 border-b border-gray-100">
                <View className="flex-row items-center">
                  <Text className="text-xl font-bold text-gray-800">Operational Hours</Text>
                </View>
              </View>
              <View className="py-0 ">
                {daysOfWeek.map(({ label, value }, index) => {
                  const schedule = mine?.operational_hours?.[value];
                  const isToday = dayjs().format("dddd").toLowerCase() === value;
                  const isOpen = schedule?.open && schedule?.close;

                  return (
                    <View key={value} className={`flex-row items-center justify-between py-3 ${index !== daysOfWeek.length - 1 ? "ca" : ""} ${isToday ? " -mx-4 px-4 rounded-lg" : ""}`}>
                      <View className="flex-row items-center px-4">
                        <Text className={`font-semibold text-lg ${isToday ? "text-blue-600" : "text-gray-600"}`}>{label}</Text>
                        {isToday && (
                          <View className="px-2 py-1 ml-2 bg-blue-500 rounded-full">
                            <Text className="text-xs font-medium text-white">Today</Text>
                          </View>
                        )}
                      </View>
                      <View className="items-end px-4">
                        {isOpen ? (
                          <Text className="text-lg font-semibold text-gray-900">
                            {schedule.open} - {schedule.close}
                          </Text>
                        ) : (
                          <Text className="text-lg font-semibold text-red-500">Closed</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            <LocationComponent mine={mine} />
          </View>
        </View>
      </ScrollView>

      <ShareComponent ref={shareSheetRef} shareableData={shareData} />

      <ReusableBottomSheet ref={contactBottomSheetRef} enablePanDownToClose={true}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-blue-100 rounded-full">
              <Feather name="phone" size={28} color="#3B82F6" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Mine Owner</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-500">Owner Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{mine?.owner_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{mine?.owner_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity onPress={handleCallPress} disabled={!mine?.owner_id?.phone} className={`flex-row items-center justify-center p-4 rounded-2xl ${!mine?.owner_id?.phone ? "bg-gray-200" : "bg-blue-500"}`}>
              <FontAwesome6 name="phone" size={18} color={!mine?.owner_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!mine?.owner_id?.phone ? "text-gray-500" : "text-white"}`}>{!mine?.owner_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => contactBottomSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={directionBottomSheetRef} enablePanDownToClose={true}>
        <LocationComponent mine={mine} />
      </ReusableBottomSheet>
    </View>
  );
};

export default MineDetail;