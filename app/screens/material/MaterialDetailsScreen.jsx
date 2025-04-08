import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TouchableWithoutFeedback } from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFetchMaterialById, useDeleteMaterial } from "../../hooks/useMaterial";
import { useState } from "react";
import Toast from "react-native-toast-message";

const MaterialDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { materialId } = route.params;
  const { data: material, isLoading } = useFetchMaterialById(materialId);

  const [modalVisible, setModalVisible] = useState(false);
const [isChecked, setIsChecked] = useState(false);
const { mutate: deleteMaterial } = useDeleteMaterial(materialId);

const handleDelete = () => {
  if (!material?._id) return;

  deleteMaterial(material._id, {
    onSuccess: () => {
      setModalVisible(false);
      setIsChecked(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Material deleted successfully.",
      });
      navigation.goBack();
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "An error occurred while deleting the material.",
      });
    },
  });
};

const toggleCheckbox = () => {
  setIsChecked((prev) => !prev);
};

const closeModal = () => {
  setModalVisible(false);
  setIsChecked(false);
};

  if (isLoading || !material) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <ScrollView className="p-4 bg-white">
      {/* Header Section */}
      <View className="flex-row items-center justify-center mb-8">
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-0 p-4">
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-center">Material Details</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} className="absolute right-0">
          <Image source={require("../../../assets/icons/delete.png")} className="w-8 h-8" />
        </TouchableOpacity>
      </View>

      {/* Image Carousel */}
      <Carousel
        data={material.photos.length ? material.photos : [{ url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" }]}
        renderItem={({ item }) => <Image source={{ uri: item.url }} className="w-full rounded-lg h-72" />}
        sliderWidth={400}
        itemWidth={400}
        loop={true}
      />

      {/* Material Name & Edit Button */}
      <View className="relative flex-row items-center justify-between mt-6">
        <Text className="text-2xl font-bold capitalize">{material.name}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("UpdateMaterial", { material })}
          className="flex flex-row items-center justify-center gap-4 px-4 py-2 rounded-full shadow-md bg-slate-200"
        >
          <Image source={require("../../../assets/icons/edit.png")} className="w-6 h-6" />
          <Text className="font-bold text-black">Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Stock & Availability Section */}
      <Text className="mt-6 mb-2 text-lg font-bold text-center text-gray-700">Stock & Availability</Text>
      <View className="my-2">
        <View className="flex-row items-center justify-between pb-2 mb-4 border-b border-gray-300">
          <View className="flex-row items-center gap-2">
            <Image source={require("../../../assets/icons/stock.png")} className="w-6 h-6" />
            <Text className="text-lg font-semibold text-gray-600">Stock</Text>
          </View>
          <Text className="text-lg font-bold text-black">{material.stock_quantity}</Text>
        </View>

        <View className="flex-row items-center justify-between pb-2 border-b border-gray-300">
          <View className="flex-row items-center gap-2">
            <Image source={require("../../../assets/icons/available.png")} className="w-6 h-6" />
            <Text className="text-lg font-semibold text-gray-600">Availability</Text>
          </View>
          <Text className="text-lg font-bold text-black">{material.availability_status}</Text>
        </View>
      </View>

      {/* Overall Price Section */}
      <Text className="mt-6 mb-2 text-lg font-bold text-center text-gray-700">Overall Price</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-auto mb-8">
        <View className="flex-row gap-3">
          {material.prices.map((price, index) => (
            <View key={index} className="items-center p-3 bg-gray-100 border border-gray-300 rounded-lg min-w-32">
              <Text className="text-base font-semibold text-gray-700 w-fit">
                ₹{(price.price / price.quantity).toFixed(2)}
              </Text>
              <Text className="text-gray-600 capitalize">{price.unit} </Text>
            </View>
          ))}
        </View>
      </ScrollView>


      {/* Pricing Section */}
      <Text className="text-lg font-bold text-center text-gray-700">Detailed Pricing</Text>
      <View className="mt-3 border border-gray-300 rounded-lg">
        {/* Table Header */}
        <View className="flex-row p-2 bg-gray-200 rounded-t-lg">
          <Text className="w-1/3 font-bold text-center text-gray-700">Unit</Text>
          <Text className="w-1/3 font-bold text-center text-gray-700">Quantity</Text>
          <Text className="w-1/3 font-bold text-center text-gray-700">Price</Text>
        </View>
        {/* Table Rows */}
        {material.prices.map((price, index) => (
          <View key={index} className={`flex-row p-2 ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
            <Text className="w-1/3 text-sm text-center capitalize">{price.unit}</Text>
            <Text className="w-1/3 text-sm text-center capitalize">{price.quantity}</Text>
            <Text className="w-1/3 text-sm text-center capitalize">₹{price.price}</Text>
          </View>
        ))}
      </View>

      <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={closeModal}>
        <View className="justify-center flex-1 bg-[#00000090] bg-opacity-50">
          <TouchableWithoutFeedback>
            <View className="p-8 m-4 bg-white rounded-lg">
              <Text className="text-2xl font-bold">
                Do you want to delete {material?.name}?
              </Text>
              <Text className="mt-2 mb-4 text-red-500">
                This action is irreversible.
              </Text>

              {/* Single Checkbox */}
              <TouchableOpacity
                onPress={toggleCheckbox}
                className="flex-row items-center mt-4"
              >
                <View
                  className={`w-6 h-6 border-2 rounded-md flex items-center justify-center ${
                    isChecked ? "bg-black border-black" : "border-gray-400"
                  }`}
                >
                  {isChecked && <Text className="font-bold text-white">✓</Text>}
                </View>
                <Text className="ml-3 text-black w-[90%]">
                  All requests related to "{material?.name}" will be canceled.
                </Text>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                disabled={!isChecked}
                onPress={handleDelete}
                className={`flex-row items-center justify-center p-4 mt-8 rounded-lg shadow-md ${
                  !isChecked ? "bg-gray-400" : "bg-red-600"
                }`}
              >
                <Text className="font-bold text-white">
                  {isChecked ? "Delete Material" : "Check the box to delete"}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={closeModal} className="mt-4">
                <Text className="text-center text-blue-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
    </ScrollView>
  );
};

export default MaterialDetailsScreen;