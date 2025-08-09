import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  Linking,
  Animated,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Carousel from "react-native-snap-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  Feather,
  FontAwesome6,
  FontAwesome5,
  FontAwesome,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFetchMaterialById } from "../../hooks/useMaterial";
import { useFetchMineById } from "../../hooks/useMine";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";

const MaterialDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { materialId } = route.params;
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get("window");
  const contactBottomSheetRef = useRef(null);

  const { data: material, isLoading: isMaterialLoading } =
    useFetchMaterialById(materialId);
  const { data: mine, isLoading: isMineLoading } = useFetchMineById(
    material?.mine_id
  );

  const [propertyModalVisible, setPropertyModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const formatter = useMemo(
    () => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }),
    []
  );

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return { text: "Available", color: "rgba(34, 197, 94, 0.9)" };
      case "limited":
        return { text: "Limited Stock", color: "rgba(245, 159, 11, 0.9)" };
      default:
        return { text: "Unavailable", color: "rgba(239, 68, 68, 0.9)" };
    }
  };

  const pluralize = (count, word) => {
    return count === 1 ? word : `${word}s`;
  };

  const handlePropertyPress = (property) => {
    setSelectedProperty(property);
    setPropertyModalVisible(true);
  };

  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (propertyModalVisible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
      }).start();
    } else {
      scaleAnim.setValue(0.5);
    }
  }, [propertyModalVisible]);

  const handleContactPress = () => {
    contactBottomSheetRef.current?.snapToIndex(0);
  };

  const handleCallPress = () => {
    const phoneNumber = mine?.owner_id?.phone;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
      contactBottomSheetRef.current?.close();
    }
  };

  // --- Render ---
  if (isMaterialLoading || isMineLoading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#000000" />
        <Text className="mt-4 font-medium text-gray-600">
          Loading material details...
        </Text>
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
      <View className="flex-1">
        <ScrollView className="flex-1 bg-slate-50">
          {/* --- 1. Dark Header --- */}
          <View className="bg-[#111827] pb-3" style={{ paddingTop: insets.top }}>
            <View className="flex-row items-center p-4 mt-1">
              <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="absolute left-8 p-3 py-3 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
              <Text className="w-full text-2xl font-bold text-center text-white">
                Material Detail
              </Text>
            </View>
          </View>

          {/* --- 2. Image Carousel --- */}
          <View className="relative">
            <Carousel
              data={bannerImages}
              renderItem={({ item }) => (
                <Image source={{ uri: item.url }} className="w-full h-80" />
              )}
              sliderWidth={screenWidth}
              itemWidth={screenWidth}
              loop={true}
              autoplay={true}
              autoplayInterval={5000}
            />
            <View className="absolute z-10 bottom-4 right-4">
              <View
                className="flex-row items-center px-3 py-1.5 rounded-full"
                style={{ backgroundColor: status.color }}
              >
                <View className="w-2.5 h-2.5 mr-2 bg-white rounded-full" />
                <Text className="font-semibold text-white text-md">
                  {status.text}
                </Text>
              </View>
            </View>
          </View>

          <View className="p-4 px-6 ">
            {/* --- 3. Material & Mine Info --- */}
            <View className="my-4">
              <Text className="mb-2 text-3xl font-bold text-gray-900 capitalize">
                {material?.name || "Material Name"}
              </Text>
              <View className="flex-row items-center">
                <FontAwesome6 name="location-dot" size={16} color="#4b5563" />
                <Text
                  className="ml-2 text-base font-semibold text-gray-600"
                  numberOfLines={1}
                >
                  {mine?.location?.address?.split(",").slice(0, 2).join(", ") ||
                    "Location not available"}
                </Text>
              </View>
            </View>

            {/* --- 4. User Detail Card --- */}
            <View className="p-6 my-4 bg-white border shadow-md border-slate-100 rounded-2xl">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="mr-4 overflow-hidden rounded-xl">
                    <LinearGradient
                      colors={["#60a5fa", "#3b82f6"]}
                      className="items-center justify-center w-16 h-16"
                    >
                      <FontAwesome5 name="user-alt" size={24} color="white" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-xl font-bold text-gray-900"
                      numberOfLines={1}
                    >
                      {mine?.owner_id?.name || "Owner Name"}
                    </Text>
                    <Text className="text-base text-gray-500" numberOfLines={1}>
                      {mine?.name || "Mine Name"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={handleContactPress}>
                    <View className="overflow-hidden rounded-xl">
                      <LinearGradient
                        colors={["#38bdf8", "#0ea5e9"]}
                        className="items-center justify-center w-14 h-14"
                      >
                        <FontAwesome6
                          name="phone"
                          size={20}
                          color="white"
                          solid
                        />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("MineDetail", { mineId: mine._id })
                    }
                  >
                    <View className="overflow-hidden rounded-xl">
                      <LinearGradient
                        colors={["#334155", "#0f172a"]}
                        className="items-center justify-center w-14 h-14"
                      >
                        <FontAwesome5 name="building" size={20} color="white" />
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            {/* --- NEW: Description Section --- */}
            {material.description && (
              <View className="p-6 my-4 bg-white border shadow-md border-slate-100 rounded-2xl">
                {/* Header */}
                <View className="flex-row items-center">
                  <View className="mr-4 overflow-hidden rounded-xl">
                    <LinearGradient
                      colors={["#a855f7", "#7e22ce"]}
                      className="items-center justify-center w-12 h-12"
                    >
                      <FontAwesome6
                        name="circle-info"
                        size={22}
                        color="white"
                      />
                    </LinearGradient>
                  </View>
                  <Text className="text-2xl font-bold text-gray-800">
                    Description
                  </Text>
                </View>
                <View className="p-4 mt-4 bg-slate-50 rounded-xl">
                  <Text className="leading-relaxed text-gray-800 text-md">
                    {material.description}
                  </Text>
                </View>
              </View>
            )}
            {/* <View className="w-full h-px my-4 bg-gray-200" /> */}

            {/* --- 5. Pricing Options --- */}
            <Text className="my-6 text-2xl font-bold text-gray-800">
              Pricing Options
            </Text>
            <View className="gap-4">
              {material.prices.map((price, index) => (
                <View key={index} style={styles.priceCardContainer}>
                  <View style={styles.priceCardContent}>
                    {/* Top Section */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-center">
                        <View className="mr-4 overflow-hidden rounded-xl">
                          <LinearGradient
                            colors={["#f6e27f", "#eab308"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="items-center justify-center w-12 h-12"
                          >
                            <FontAwesome6 name="cube" size={20} color="white" />
                          </LinearGradient>
                        </View>
                        <View>
                          <Text className="text-xl font-bold text-gray-800 capitalize">
                            per {price.unit.name}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            Min. Order:{" "}
                            {formatter.format(price.minimum_order_quantity)}{" "}
                            {pluralize(
                              price.minimum_order_quantity,
                              price.unit.name
                            )}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-2xl font-black text-slate-700">
                        ₹{formatter.format(price.price)}
                      </Text>
                    </View>
                    <View className="w-full h-px my-4 bg-slate-200" />
                    {/* Bottom Section */}
                    <View className="flex-row items-center justify-between p-2">
                      <View className="flex-row items-center">
                        <FontAwesome6 name="cubes" size={16} color="#94a3b8" />
                        <Text className="ml-2 font-semibold text-gray-600">
                          Stock Available
                        </Text>
                      </View>
                      <Text className="font-bold text-gray-800">
                        {formatter.format(price.stock_quantity)}{" "}
                        {pluralize(price.stock_quantity, price.unit.name)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View className="w-full h-px mt-10 bg-gray-200" />

            {/* --- 6. Material Properties --- */}
            <Text className="my-6 text-2xl font-bold text-gray-800">
              Material Properties
            </Text>
            <View className="flex-row flex-wrap">
              {material.properties.map((prop, index) => (
                <View key={index} className="w-1/2 px-2 mb-4">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handlePropertyPress(prop)}
                    className="justify-center p-4 bg-white border shadow-sm h-28 border-slate-100 rounded-2xl"
                  >
                    <Text
                      className="font-semibold text-gray-500 capitalize text-md"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {prop.name}
                    </Text>
                    <Text
                      className="mt-1 text-xl font-bold text-gray-800 capitalize"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {prop.value}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View className="w-full h-px my-6 bg-gray-200" />

            {/* --- 8. Quality Assured Card --- */}
            <View className="my-4 overflow-hidden border-2 shadow-sm rounded-2xl border-slate-100">
              <LinearGradient
                colors={["#F0FDF4", "#f0f9ff"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                className="flex-row items-center p-6"
              >
                <View className="mr-4 overflow-hidden rounded-xl">
                  <LinearGradient
                    colors={["#21C25C", "#17A54B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="items-center justify-center h-16 w-14"
                  >
                    <FontAwesome5 name="shield-alt" size={22} color="white" />
                  </LinearGradient>
                </View>
                <View>
                  <Text className="text-xl font-bold text-gray-900">
                    Quality Assured
                  </Text>
                  <Text className="text-gray-600 text-md">
                    Tested & Certified Material
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-4 px-8 bg-white border-t border-gray-50">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("RequestMaterial", { material, mine })}
            className="flex-row items-center justify-center py-4 bg-black rounded-xl"
          >
            {/* <FontAwesome6 name="cart-plus" size={22} color="white" /> */}
            <Text className="text-xl font-bold text-slate-200">Request</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={propertyModalVisible}
          animationType="fade"
          className="flex-1 bg-black"
          transparent={true}
        >
          <TouchableWithoutFeedback
            onPress={() => setPropertyModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View className="">
                  <Animated.View
                    style={[{ transform: [{ scale: scaleAnim }] }]}
                    className="justify-center px-8 py-4 bg-white shadow-xl min-h-40 min-w-80 rounded-2xl"
                  >
                    <Text className="text-lg font-semibold text-gray-500 capitalize">
                      {selectedProperty?.name}
                    </Text>
                    <Text className="mt-2 text-xl font-bold text-gray-900 capitalize">
                      {selectedProperty?.value}
                    </Text>
                  </Animated.View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>

      {/* --- Contact Bottom Sheet --- */}
      <ReusableBottomSheet
        ref={contactBottomSheetRef}
        snapPoints={["55%"]}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: "#fff" }}
        handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      >
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-blue-100 rounded-full">
              <Feather name="phone" size={28} color="#3B82F6" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">
              Contact Mine Owner
            </Text>
            <Text className="text-center text-gray-600 text-md">
              Get in touch with the mine owner for inquiries
            </Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Owner Name
                  </Text>
                  <Text className="text-lg font-semibold text-gray-900">
                    {mine?.owner_id?.name || "Not available"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Phone Number
                  </Text>
                  <Text className="text-lg font-semibold text-gray-900">
                    {mine?.owner_id?.phone || "Not available"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity
              onPress={handleCallPress}
              disabled={!mine?.owner_id?.phone}
              className={`flex-row items-center justify-center p-4 rounded-2xl ${
                !mine?.owner_id?.phone ? "bg-gray-200" : "bg-blue-500"
              }`}
            >
              <FontAwesome6
                name="phone"
                size={18}
                color={!mine?.owner_id?.phone ? "#9CA3AF" : "#ffffff"}
                solid
              />
              <Text
                className={`ml-2 text-lg font-bold ${
                  !mine?.owner_id?.phone ? "text-gray-500" : "text-white"
                }`}
              >
                {!mine?.owner_id?.phone ? "Phone Not Available" : "Call Now"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => contactBottomSheetRef.current?.close()}
              className="p-4 bg-gray-100 rounded-2xl"
            >
              <Text className="text-lg font-bold text-center text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  priceCardContainer: {
    borderRadius: 20,
    backgroundColor: "white",
    shadowColor: "#9ca3af",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  priceCardContent: {
    borderRadius: 20,
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
});

export default MaterialDetail;
