import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
  TouchableWithoutFeedback,
} from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation } from "@react-navigation/native";
import dayjs from "dayjs";
import { useFetchMineById, useDeleteMine } from "../../hooks/useMine";
import Toast from "react-native-toast-message";

const ViewMineScreen = ({ route }) => {
  const { mineId } = route.params;
  const navigation = useNavigation();
  const [selectedDay, setSelectedDay] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    materials: false,
    requests: false,
    trips: false,
  });

  const { data: mine, isLoading, error, refetch } = useFetchMineById(mineId);
  const { mutateAsync: deleteMine } = useDeleteMine();

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

  const handleDelete = async () => {
    try {
      // if (mine?.banner_images?.length > 0) {
      //   for (const image of mine.banner_images) {
      //     if (image?.public_id) {
      //       await deleteImageFromCloudinary(image.public_id);
      //     }
      //   }
      // }
      await deleteMine(mine._id);

      Toast.show({
        type: "success",
        text1: "Mine deleted successfully",
      });
      
      navigation.goBack();
    } catch (error) {
      console.log("Error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to delete mine",
      });
    }
  };  

  // Function to toggle checkboxes
  const toggleCheckbox = (key) => {
    setCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if all checkboxes are ticked
  const allChecked = Object.values(checkboxes).every(Boolean);

  const bannerImages = mine?.banner_images?.length
    ? mine.banner_images
    : [
        {
          url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
        },
      ];

  const isDeleteDisabled = !Object.values(checkboxes).every(Boolean);

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar barStyle="dark-content" backgroundColor={"#fff"} />

      {/* Header */}
      <View className="flex-row items-center justify-center mb-8">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 p-4"
        >
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-center">Mine</Text>
        {/* delete button icon  */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute right-0"
        >
          <Image
            source={require("../../../assets/icons/delete.png")}
            className="w-8 h-8"
          />
        </TouchableOpacity>
      </View>

      {/* Image Carousel */}
      <Carousel
        data={bannerImages}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            className="w-full rounded-lg h-72"
          />
        )}
        sliderWidth={400}
        itemWidth={400}
        loop={true}
      />

      {/* Mine Name and Address */}
      <View className="flex-row items-center mt-8">
        <Text className="text-2xl font-bold">{mine?.name}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("UpdateMine", { mine })}
          className="absolute right-0 flex flex-row items-center justify-center gap-4 px-4 py-2 rounded-full shadow-md bg-slate-200"
        >
          <Image
            source={require("../../../assets/icons/edit.png")}
            className="w-6 h-6"
          />
          <Text className="font-bold text-black">Edit</Text>
        </TouchableOpacity>
      </View>
      {/* Location */}
      <View className="mt-8">
        <Text className="text-xl font-bold text-black">Location</Text>

        <View className="flex-row items-center p-4 mt-2 bg-gray-100 rounded-lg">
          <Image
            source={require("../../../assets/icons/location.png")}
            className="w-6 h-6 mr-4"
          />
          <Text className="text-base text-slate-600 w-[90%]">
            {mine?.location?.address || "Not available"}
          </Text>
        </View>
      </View>

      {/* Operational Hours */}
      <Text className="mt-8 text-xl font-bold text-black">
        Operational Hours
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
      >
        {daysOfWeek.map(({ label, value }) => (
          <TouchableOpacity
            key={value}
            activeOpacity={1}
            className={`px-4 py-2 mr-2 rounded-lg ${
              selectedDay === value ? "bg-black text-white" : "bg-gray-100"
            }`}
            onPress={() => setSelectedDay(value)}
          >
            <Text
              className={
                selectedDay === value
                  ? "text-white font-bold"
                  : "text-black font-medium"
              }
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="flex items-center justify-center p-4 mt-4 bg-gray-100 rounded-lg min-h-24">
        {mine?.operational_hours?.[selectedDay]?.open &&
        mine?.operational_hours?.[selectedDay]?.close ? (
          <View className="flex-row items-center justify-center space-x-4">
            <View className="px-6 py-3 bg-white rounded-lg shadow-md">
              {/* <Text className="text-lg font-bold text-black">From</Text> */}
              <Text className="mt-1 text-xl font-bold text-black">
                {mine.operational_hours[selectedDay].open}
              </Text>
            </View>

            <Text className="mx-4 text-2xl font-bold text-black">to</Text>

            <View className="px-6 py-3 bg-white rounded-lg shadow-md">
              {/* <Text className="text-lg font-bold text-black">To</Text> */}
              <Text className="mt-1 text-xl font-bold text-black">
                {mine.operational_hours[selectedDay].close}
              </Text>
            </View>
          </View>
        ) : (
          <Text className="text-lg font-bold text-center text-red-500">
            Holiday
          </Text>
        )}
      </View>

      {/* View Materials Button */}
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("MyMaterials", { mineId: mine?._id })
        }
        className="w-full py-4 mt-8 bg-black rounded-lg"
      >
        <Text className="text-lg font-bold text-center text-white">
          View Materials
        </Text>
      </TouchableOpacity>

      {/* Delete Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
        <View className="justify-center flex-1 bg-[#00000090] bg-opacity-50">
          <View className="p-8 m-4 bg-white rounded-lg">
            <Text className="text-2xl font-bold">
              Do you want to delete "{mine?.name}"?
            </Text>
            <Text className="mt-2 mb-4 text-red-500">
              This action is irreversible.
            </Text>

            {[
              {
                key: "materials",
                label:
                  "Deleting mine will also delete all associated materials.",
              },
              {
                key: "requests",
                label: "Deleting mine will also delete all requests.",
              },
              {
                key: "trips",
                label: "Deleting mine will cancel all ongoing trips.",
              },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => toggleCheckbox(key)}
                className="flex-row items-center mt-4"
              >
                <View
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center ${
                    checkboxes[key]
                      ? "bg-black border-black"
                      : "border-gray-400"
                  }`}
                >
                  {checkboxes[key] && (
                    <Text className="font-bold text-white">✓</Text>
                  )}
                </View>
                <Text className="ml-3 text-black">{label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              disabled={!allChecked}
              onPress={handleDelete}
              className={`flex-row items-center justify-center p-4 mt-8 rounded-lg shadow-md ${
                isDeleteDisabled ? "bg-gray-400" : "bg-red-600"
              }`}
            >
              <Text className="font-bold text-white">
                {" "}
                {allChecked ? "Delete Mine" : "Check all boxes to delete"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-blue-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScrollView>
  );
};

export default ViewMineScreen;

// const deleteImageFromCloudinary = async (publicId) => {
//   const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
//   try {
//     const response = await fetch(
//       `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           public_id: publicId,
//           api_key: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY,
//           api_secret: process.env.EXPO_PUBLIC_CLOUDINARY_API_SECRET,
//         }),
//       }
//     );

//     const result = await response.json();
//     if (result.result === 'ok') {
//       console.log(`Deleted image: ${publicId}`);
//     } else {
//       console.error('Failed to delete image:', result);
//     }
//   } catch (error) {
//     console.error('Error deleting image:', error);
//   }
// };
