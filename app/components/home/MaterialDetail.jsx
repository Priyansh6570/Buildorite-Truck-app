import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import Carousel from "react-native-snap-carousel";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFetchMaterialById } from "../../hooks/useMaterial";
import convertToIndianNumberSystem from "../../components/utils/ConvertToIndianSystem";

const MaterialDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { materialId } = route.params;
  const { data: material, isLoading } = useFetchMaterialById(materialId);

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
      </View>

      {/* Image Carousel */}
      <Carousel
        data={material.photos.length ? material.photos : [{ url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png" }]}
        renderItem={({ item }) => <Image source={{ uri: item.url }} className="w-full rounded-lg h-72" />}
        sliderWidth={400}
        itemWidth={400}
        loop={true}
      />

      {/* Material Name */}
      <View className="mt-6">
        <Text className="text-2xl font-bold capitalize">{material.name}</Text>
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
                ₹{convertToIndianNumberSystem((price.price / price.quantity).toFixed(2))}
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
            <Text className="w-1/3 text-sm text-center capitalize">₹{convertToIndianNumberSystem(price.price)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default MaterialDetail;