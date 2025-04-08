import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import { useFetchMineById } from "../../hooks/useMine";

const MineDetail = ({ route }) => {
  const { mineId } = route.params;
  const navigation = useNavigation();
  const [selectedDay, setSelectedDay] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data: mine, isLoading, error, refetch } = useFetchMineById(mineId);

  useEffect(() => {
    if (mine) {
      const today = dayjs().format("dddd").toLowerCase();
      setSelectedDay(today);
    }
  }, [mine]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const daysOfWeek = [
    { label: "Mon", value: "monday" },
    { label: "Tue", value: "tuesday" },
    { label: "Wed", value: "wednesday" },
    { label: "Thu", value: "thursday" },
    { label: "Fri", value: "friday" },
    { label: "Sat", value: "saturday" },
    { label: "Sun", value: "sunday" },
  ];

  const getDaySchedule = (day) => {
    const schedule = mine?.operational_hours?.[day];
    if (schedule?.open && schedule?.close) {
      return `${schedule.open} - ${schedule.close}`;
    }
    return "Holiday";
  };

  const bannerImages = mine?.banner_images?.length
    ? mine.banner_images
    : [
        {
          url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
        },
      ];

  if (isLoading) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <Text className="text-red-500">Failed to load mine data.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 p-4 bg-white"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatusBar barStyle="dark-content" backgroundColor={"#fff"} />

      {/* Header */}
      <View className="flex-row items-center justify-center mb-8">
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-0 p-4">
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-center">Mine</Text>
      </View>

      {/* Image Carousel */}
      <Carousel
        data={bannerImages}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} className="w-full rounded-lg h-72" />
        )}
        sliderWidth={400}
        itemWidth={400}
        loop={true}
      />

      {/* Mine Name and Address */}
      <View className="mt-8">
        <Text className="text-2xl font-bold">{mine?.name}</Text>
      </View>
      {/* Location */}
      <View className="mt-8">
        <Text className="text-xl font-bold text-black">Location</Text>

        <View className="flex-row items-center p-4 mt-2 bg-gray-100 rounded-lg">
          <Image source={require("../../../assets/icons/location.png")} className="w-6 h-6 mr-4" />
          <Text className="text-base text-slate-600 w-[90%]">{mine?.location?.address || "Not available"}</Text>
        </View>
      </View>

      {/* Operational Hours */}
      <Text className="mt-8 text-xl font-bold text-black">Operational Hours</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
        {daysOfWeek.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            activeOpacity={1}
            className={`px-4 py-2 mr-2 rounded-lg ${selectedDay === value ? "bg-black text-white" : "bg-gray-100"}`}
            onPress={() => setSelectedDay(value)}
          >
            <Text className={selectedDay === value ? "text-white font-bold" : "text-black font-medium"}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="flex items-center justify-center p-4 mt-4 bg-gray-100 rounded-lg min-h-24">
        {mine?.operational_hours?.[selectedDay]?.open && mine?.operational_hours?.[selectedDay]?.close ? (
          <View className="flex-row items-center justify-center space-x-4">
            <View className="px-6 py-3 bg-white rounded-lg shadow-md">
              <Text className="mt-1 text-xl font-bold text-black">{mine.operational_hours[selectedDay].open}</Text>
            </View>

            <Text className="mx-4 text-2xl font-bold text-black">to</Text>

            <View className="px-6 py-3 bg-white rounded-lg shadow-md">
              <Text className="mt-1 text-xl font-bold text-black">{mine.operational_hours[selectedDay].close}</Text>
            </View>
          </View>
        ) : (
          <Text className="text-lg font-bold text-center text-red-500">Holiday</Text>
        )}
      </View>

      {/* View Materials Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("MineMaterials", { mineId: mine?._id })}
        className="w-full py-4 mt-8 bg-black rounded-lg"
      >
        <Text className="text-lg font-bold text-center text-white">View Materials</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MineDetail;