import React, { useState, useRef, useMemo, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Linking, Alert, StyleSheet, LayoutAnimation, Platform, UIManager } from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useNavigation, useRoute } from "@react-navigation/native";
import Carousel from "react-native-snap-carousel";
import Collapsible from "react-native-collapsible";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFetchMaterialById, useAddMaterialView } from "../../hooks/useMaterial";
import { useFetchMineById } from "../../hooks/useMine";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const MaterialDetail = () => {
  console.log("MaterialDetail component rendered");
  const navigation = useNavigation();
  const route = useRoute();
  const { materialId } = route.params;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get("window");
  const contactBottomSheetRef = useRef(null);

  const { data: material, isLoading: isMaterialLoading } = useFetchMaterialById(materialId);
  const { data: mine, isLoading: isMineLoading } = useFetchMineById(material?.mine_id);

  const { mutate: addMaterialView } = useAddMaterialView();
  useEffect(() => {
    if (materialId) {
      addMaterialView(materialId);
    }
  }, [materialId, addMaterialView]);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [expandedProperties, setExpandedProperties] = useState({});

  const formatter = useMemo(() => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }), []);

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return { text: "Available", color: "#22c55e" };
      case "limited":
        return { text: "Limited Stock", color: "#f59e0b" };
      default:
        return { text: "Unavailable", color: "#ef4444" };
    }
  };

  const pluralize = (count, word) => {
    return count === 1 ? word : `${word}s`;
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

  const toggleProperty = (index) => {
    setExpandedProperties((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const onSnapToItem = (index) => {
    setCurrentSlide(index);
  };

  if (isMaterialLoading || isMineLoading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 font-medium text-gray-600">Loading material details...</Text>
      </View>
    );
  }

  const status = getStatusStyle(material?.availability_status);
  const bannerImages =
    material?.photos?.length > 0
      ? material.photos
      : [
          {
            url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
          },
        ];

  return (
    <View className="flex-1">
      <View className="bg-[#111827]" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-3 bg-[#2C3441] bg-opacity-70 border border-slate-700 rounded-xl">
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text className="w-full -ml-10 text-2xl font-bold text-center text-white">Material Detail</Text>
        </View>
      </View>

      <View className="flex-1">
        <ScrollView className="flex-1 mb-8 bg-white">
          <View className="relative">
            <Carousel
              data={bannerImages}
              renderItem={({ item }) => (
                <View className="w-full h-80">
                  <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                </View>
              )}
              sliderWidth={screenWidth}
              itemWidth={screenWidth}
              loop={bannerImages.length > 1}
              autoplay={bannerImages.length > 1}
              autoplayInterval={5000}
              onSnapToItem={(index) => setCurrentSlide(index)}
              removeClippedSubviews={false}
              enableMomentum={false}
              lockScrollWhileSnapping={true}
            />
            <View className="absolute z-10 bottom-4 left-4">
              <View className="px-4 py-2 bg-black rounded-lg bg-opacity-70">
                <Text className="text-base font-bold text-white">
                  {currentSlide + 1}/{bannerImages.length}
                </Text>
              </View>
            </View>
            <View className="absolute z-10 bottom-4 right-4">
              <View className="flex-row items-center px-3 py-1.5 rounded-full" style={{ backgroundColor: status.color }}>
                <View className="w-2.5 h-2.5 mr-2 bg-white rounded-full" />
                <Text className="font-semibold text-white text-md">{status.text}</Text>
              </View>
            </View>
          </View>

          <View className="p-4 px-6">
            <View className="my-4">
              <Text className="mb-2 text-3xl font-bold text-gray-900 capitalize">{material?.name || "Material Name"}</Text>
              <View className="flex-row items-center">
                <FontAwesome6 name="location-dot" size={16} color="#4b5563" />
                <Text className="ml-2 text-base font-semibold text-gray-600" numberOfLines={1}>
                  {mine?.location?.address?.split(",").slice(0, 2).join(", ") || "Location not available"}
                </Text>
              </View>
            </View>

            <View className="mt-4 mb-12">
              <View className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="overflow-hidden rounded-lg">
                      <LinearGradient colors={["#3b82f6", "#1e40af"]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} className="flex items-center justify-center w-12 h-12 rounded-xl">
                        <FontAwesome5 name="building" size={18} color="white" solid />
                      </LinearGradient>
                    </View>
                    <View className="mb-2 ml-3">
                      <Text className="text-lg font-bold gray-900 text-">{mine?.owner_id?.name || "Owner Name"}</Text>
                      <Text className="text-sm text-gray-600">{mine?.name || "Mine Name"}</Text>
                    </View>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity activeOpacity={0.8} onPress={handleContactPress} className="flex-row items-center justify-center flex-1 py-3.5 bg-[#1e40af] rounded-xl">
                    <FontAwesome6 name="phone" size={14} color="white" />
                    <Text className="ml-2 font-semibold text-white text-md">Call Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("MineDetail", { mineId: mine._id })} className="flex-row items-center justify-center flex-1 py-3.5 bg-gray-100 rounded-xl">
                    <FontAwesome6 name="location-dot" size={15} color="#374151" />
                    <Text className="ml-2 font-semibold text-gray-700 text-md">View Mine</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text className="mb-6 text-xl font-bold text-gray-900">Pricing Options</Text>

            <View className="gap-4 mb-6">
              {material.prices.map((price, index) => (
                <View key={index} className="p-6 bg-white border shadow-sm border-slate-100 rounded-2xl">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-black capitalize">per {price.unit.name}</Text>
                      <Text className="mt-1 text-sm text-gray-500">
                        Min. Order:{" "}
                        <Text className="font-semibold text-gray-700">
                          {formatter.format(price.minimum_order_quantity)} {pluralize(price.minimum_order_quantity, price.unit.name)}
                        </Text>
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-3xl font-black text-black">₹{formatter.format(price.price)}</Text>
                      <Text className="text-sm text-gray-500">per {price.unit.name}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <View className="flex-row items-center">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-green-100 rounded-full">
                        <FontAwesome6 name="cubes" size={14} color="#059669" />
                      </View>
                      <Text className="font-semibold text-gray-700">Stock Available</Text>
                    </View>
                    <Text className="text-lg font-bold text-green-600">
                      {formatter.format(price.stock_quantity)} {pluralize(price.stock_quantity, price.unit.name)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <Text className="mt-6 mb-6 text-xl font-bold text-gray-900">Material Properties</Text>
            <View className="p-4 mb-6 bg-white shadow-sm rounded-2xl">
              <View className="gap-3">
                {material.properties.map((prop, index) => (
                  <View key={index} className="overflow-hidden bg-gray-50 rounded-2xl">
                    <TouchableOpacity onPress={() => toggleProperty(index)} className="flex-row items-center justify-between p-5" activeOpacity={1}>
                      <Text className="flex-1 text-lg font-semibold text-gray-700 capitalize">{prop.name}</Text>
                      <View className="ml-4">
                        <Feather name={expandedProperties[index] ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                      </View>
                    </TouchableOpacity>

                    <Collapsible collapsed={!expandedProperties[index]} duration={200}>
                      <View className="px-5 pb-5">
                        <View className="w-full h-px mb-4 bg-gray-100" />
                        <Text className="text-base font-medium leading-relaxed text-gray-800">{prop.value}</Text>
                      </View>
                    </Collapsible>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-6 overflow-hidden border-2 shadow-sm rounded-2xl border-slate-100">
              <LinearGradient colors={["#F0FDF4", "#f0f9ff"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="flex-row items-center p-6">
                <View className="mr-4 overflow-hidden rounded-xl">
                  <LinearGradient colors={["#21C25C", "#17A54B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center justify-center h-16 w-14">
                    <FontAwesome5 name="shield-alt" size={22} color="white" />
                  </LinearGradient>
                </View>
                <View>
                  <Text className="text-xl font-bold text-gray-900">Quality Assured</Text>
                  <Text className="text-gray-600 text-md">Tested & Certified Material</Text>
                </View>
              </LinearGradient>
            </View>

            {material.description && (
              <>
                <Text className="mt-6 mb-4 text-xl font-bold text-gray-900">Description</Text>
                <View className="p-4 mb-6 bg-white shadow-sm rounded-2xl">
                  <Text className="leading-relaxed text-gray-600">{material.description}</Text>
                </View>
              </>
            )}
          </View>

          <View className="h-8" />
        </ScrollView>
      </View>

      <View className="absolute bottom-0 left-0 right-0 p-4 px-8 bg-white border-t border-gray-50">
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("RequestMaterial", { material, mine })} className="flex-row items-center justify-center py-4 bg-black rounded-xl">
          <Text className="text-xl font-bold text-slate-200">Request</Text>
        </TouchableOpacity>
      </View>

      <ReusableBottomSheet ref={contactBottomSheetRef} snapPoints={["55%"]} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-blue-100 rounded-full">
              <Feather name="phone" size={28} color="#3B82F6" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Mine Owner</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with the mine owner for inquiries</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Owner Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{mine?.owner_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{mine?.owner_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity activeOpacity={0.8} onPress={handleCallPress} disabled={!mine?.owner_id?.phone} className={`flex-row items-center justify-center p-4 rounded-2xl ${!mine?.owner_id?.phone ? "bg-gray-200" : "bg-blue-500"}`}>
              <FontAwesome6 name="phone" size={18} color={!mine?.owner_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!mine?.owner_id?.phone ? "text-gray-500" : "text-white"}`}>{!mine?.owner_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => contactBottomSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

export default MaterialDetail;
