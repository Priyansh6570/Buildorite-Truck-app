import { useRef, useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Carousel from "react-native-snap-carousel";
import { Animated, Easing } from "react-native";
import ReusableBottomSheet from "../Ui/ReusableBottomSheet";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFetchMaterialById } from "../../hooks/useMaterial";
import { useCreateRequest } from "../../hooks/useRequest";
import convertToIndianNumberSystem from "../../components/utils/ConvertToIndianSystem";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import LocationInput from "../utils/LocationInput";
import Toast from "react-native-toast-message";

const MaterialDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { materialId } = route.params;
  const { data: material, isLoading } = useFetchMaterialById(materialId);
  const { mutate: createRequest, isLoading: isCreatingRequest } =
    useCreateRequest();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const bgAnim = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => ["90%", "100%"], []);
  const bottomSheetRef = useRef(null);
  const fadeTo = (toValue) => {
    Animated.timing(bgAnim, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const [quantityError, setQuantityError] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  // Form state for request
  const [requestForm, setRequestForm] = useState({
    delivery_method: "pickup",
    delivery_location: null,
    comments: "",
    selected_unit: null,
    quantity: "",
    calculated_price: 0,
  });

  // Get available units from material prices
  const availableUnits = useMemo(() => {
    if (!material?.prices) return [];
    return material.prices.map((price) => ({
      unit: price.unit,
      stock_quantity: price.stock_quantity,
      price: price.price,
      pricePerUnit: price.price / price.stock_quantity,
    }));
  }, [material?.prices]);

  // Get selected unit data
  const selectedUnitData = useMemo(() => {
    return availableUnits.find((u) => u.unit === requestForm.selected_unit);
  }, [requestForm.selected_unit, availableUnits]);

  // Calculate total stock quantity for display in header
  const totalStockQuantity = useMemo(() => {
    if (!material?.prices) return 0;
    return material.prices.reduce(
      (total, price) => total + price.stock_quantity,
      0
    );
  }, [material?.prices]);

  // Calculate price whenever quantity or unit changes
  useEffect(() => {
    if (requestForm.quantity && requestForm.selected_unit && selectedUnitData) {
      const quantity = parseInt(requestForm.quantity);
      if (!isNaN(quantity) && quantity > 0) {
        const totalPrice = selectedUnitData.pricePerUnit * quantity;
        setRequestForm((prev) => ({
          ...prev,
          calculated_price: totalPrice,
        }));
      }
    }
  }, [requestForm.quantity, requestForm.selected_unit, selectedUnitData]);

  const handleBottomSheetOpen = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleBottomSheetClose = () => {
    bottomSheetRef.current?.close();
    setRequestForm({
      delivery_method: "pickup",
      delivery_location: null,
      comments: "",
      selected_unit: null,
      quantity: "",
      price_confirmed: false,
      calculated_price: 0,
    });
    setShowUnitDropdown(false);
    setQuantityError(false);
  };

  const handleSheetChanges = useCallback((index) => {
    console.log("handleSheetChanges", index);
  }, []);

  const handleInputChange = (field, value) => {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationSelect = (location) => {
    setRequestForm((prev) => ({
      ...prev,
      delivery_location: location,
    }));
  };

  const handleUnitSelect = (unit) => {
    setRequestForm((prev) => ({
      ...prev,
      selected_unit: unit,
      quantity: "", // Reset quantity when unit changes
    }));
    setQuantityError(false);
    setShowUnitDropdown(false);
  };

  const handleQuantityChange = (value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");

    // Validate against selected unit's stock quantity
    if (numericValue && selectedUnitData) {
      const quantity = parseInt(numericValue);
      setQuantityError(quantity > selectedUnitData.stock_quantity);
    } else {
      setQuantityError(false);
    }

    handleInputChange("quantity", numericValue);
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#f0f0f0"],
  });

  const isFormValid = useMemo(() => {
    return (
      requestForm.delivery_method &&
      requestForm.delivery_location &&
      requestForm.selected_unit &&
      requestForm.quantity &&
      !quantityError &&
      requestForm.calculated_price > 0
    );
  }, [requestForm, quantityError]);

  const handleSubmitRequest = () => {
    // Validate required fields
    if (!requestForm.delivery_location) {
      Alert.alert("Error", "Please select a location");
      return;
    }

    if (!requestForm.selected_unit) {
      Alert.alert("Error", "Please select a unit");
      return;
    }

    if (!requestForm.quantity || parseInt(requestForm.quantity) <= 0) {
      Alert.alert("Error", "Please enter a valid quantity");
      return;
    }

    if (!requestForm.price_confirmed) {
      Alert.alert("Error", "Please confirm the price to proceed");
      return;
    }

    const requestData = {
      mine_id: material.mine_id,
      material_id: materialId,
      delivery_method: requestForm.delivery_method,
      delivery_location: {
        type: "Point",
        coordinates: requestForm.delivery_location.coordinates,
        address: requestForm.delivery_location.address,
      },
      comments: requestForm.comments.replace(/\n/g, "<NEWLINE>"),
      selected_unit: requestForm.selected_unit,
      quantity: parseInt(requestForm.quantity),
      price_confirmed: requestForm.calculated_price,
    };

    // console.log("Submitting request:", requestData);

    createRequest(requestData, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "Request Created Successfully",
          visibilityTime: 3000,
        });
        handleBottomSheetClose();
      },
      onError: (error) => {
        console.error("Request creation error:", error);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Failed to create request"
        );
      },
    });
  };

  const isAvailable =
    material?.availability_status?.toLowerCase() === "available";

  if (isLoading || !material) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      {/* <StatusBar
        hidden={Platform.OS == "ios" ? true : false}
        barStyle="dark-content"
        backgroundColor="black"
      /> */}
      <View style={{ flex: 1 }} className="bg-white">
        <Animated.View
          style={{ flex: 1, backgroundColor: bgColor }}
          className=""
        >
          <ScrollView className="">
            {/* Header */}
            <View className="relative bg-white shadow-sm">
              <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="items-center justify-center p-3 bg-gray-100 rounded-full"
                >
                  <Text className="relative text-lg font-black text-gray-700 top-[-4px]">
                    ←
                  </Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">
                  Material Details
                </Text>
                <View className="w-10" />
              </View>
            </View>

            {/* Image Carousel */}
            <View className="px-4 pt-2 pb-4 bg-white">
              <View className="overflow-hidden shadow-md rounded-2xl">
                <Carousel
                  data={
                    material.photos.length
                      ? material.photos
                      : [
                          {
                            url: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
                          },
                        ]
                  }
                  renderItem={({ item }) => (
                    <Image
                      source={{ uri: item.url }}
                      className="w-full bg-gray-200 h-72"
                      resizeMode="cover"
                    />
                  )}
                  sliderWidth={400}
                  itemWidth={400}
                  loop={true}
                />
              </View>
            </View>

            {/* Material Name */}
            <View className="px-4 pb-6 bg-white">
              <Text className="text-2xl font-bold leading-tight text-gray-900 capitalize">
                {material.name}
              </Text>
              <Text className="mt-1 text-sm tracking-wide text-gray-500 uppercase">
                Material Details
              </Text>
            </View>

            {/* Divider */}
            <View className="h-2 bg-gray-50" />

            {/* Availability + Stock */}
            <View className="px-4 py-6 bg-white">
              <Text className="mb-4 text-xl font-bold text-gray-800">
                Stock & Availability
              </Text>

              <View className="p-5 border border-gray-100 shadow-sm bg-gray-50 rounded-2xl">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="p-2 bg-white rounded-full shadow-sm">
                      <Image
                        source={require("../../../assets/icons/available.png")}
                        className="w-5 h-5"
                      />
                    </View>
                    <Text className="text-lg font-medium text-gray-700">
                      Availability Status
                    </Text>
                  </View>

                  <View
                    className={`px-4 py-2 rounded-full shadow-sm ${
                      material.availability_status.toLowerCase() === "available"
                        ? "bg-green-100 border border-green-200"
                        : material.availability_status.toLowerCase() ===
                          "limited"
                        ? "bg-yellow-100 border border-yellow-200"
                        : "bg-red-100 border border-red-200"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold capitalize ${
                        material.availability_status.toLowerCase() ===
                        "available"
                          ? "text-green-700"
                          : material.availability_status.toLowerCase() ===
                            "limited"
                          ? "text-yellow-700"
                          : "text-red-700"
                      }`}
                    >
                      {material.availability_status}
                    </Text>
                  </View>
                </View>

                {/* Stock Breakdown */}
                {isAvailable && (
                  <View className="p-4 bg-white border border-gray-100 rounded-xl">
                    <Text className="mb-3 text-sm font-bold tracking-wider text-gray-600 uppercase">
                      Current Stock Levels
                    </Text>
                    {material.prices.map((price, index) => (
                      <View
                        key={index}
                        className="flex-row items-center justify-between py-3 border-b border-gray-50 last:border-b-0"
                      >
                        <View className="flex-row items-center gap-2">
                          <View className="w-2 h-2 bg-blue-500 rounded-full" />
                          <Text className="font-semibold text-gray-700 capitalize">
                            {price.unit}
                          </Text>
                        </View>
                        <Text className="text-lg font-bold text-gray-900">
                          {price.stock_quantity} {price.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Unavailable Case */}
                {!isAvailable && (
                  <View className="p-4 border border-red-100 bg-red-50 rounded-xl">
                    <Text className="font-medium text-center text-red-700">
                      This material is currently unavailable. Stock and pricing
                      information is not displayed.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Pricing Info */}
            {isAvailable && (
              <>
                <View className="h-2 bg-gray-50" />
                <View className="px-4 pt-6 bg-white">
                  <Text className="mb-4 text-xl font-bold text-gray-800">
                    Pricing Information
                  </Text>
                  <View className="gap-4">
                    {material.prices.map((price, index) => (
                      <View
                        key={index}
                        className="p-5 bg-white border border-blue-100 shadow-sm rounded-2xl"
                      >
                        <View className="flex-row items-center justify-between mb-4">
                          <View className="flex-1">
                            <Text className="text-3xl font-bold text-gray-900">
                              ₹{convertToIndianNumberSystem(price.price)}
                            </Text>
                            <Text className="mt-1 text-base font-medium text-gray-600 capitalize">
                              per {price.unit}
                            </Text>
                          </View>
                          <View className="items-end px-4 py-3 bg-white border border-blue-100 rounded-xl">
                            <Text className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                              In Stock
                            </Text>
                            <Text className="text-2xl font-bold text-blue-600">
                              {price.stock_quantity}
                            </Text>
                            <Text className="text-sm font-medium text-gray-600 capitalize">
                              {price.unit}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-xl">
                          <View className="flex-row items-center gap-3">
                            <View
                              className={`w-3 h-3 rounded-full ${
                                price.stock_quantity > 100
                                  ? "bg-green-500"
                                  : price.stock_quantity > 20
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <Text className="text-sm font-bold text-gray-700">
                              Stock Level
                            </Text>
                          </View>

                          <Text
                            className={`text-sm font-bold px-3 py-1 rounded-full ${
                              price.stock_quantity > 100
                                ? "text-green-700 bg-green-100"
                                : price.stock_quantity > 20
                                ? "text-yellow-700 bg-yellow-100"
                                : "text-red-700 bg-red-100"
                            }`}
                          >
                            {price.stock_quantity > 100
                              ? "High Stock"
                              : price.stock_quantity > 20
                              ? "Medium Stock"
                              : "Low Stock"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}
            {isAvailable && <View className="px-4">
              <TouchableOpacity
                onPress={handleBottomSheetOpen}
                activeOpacity={0.8}
                className="mt-2 mb-11"
              >
                <View className="p-4 mt-6 bg-green-600 rounded-lg">
                  <Text className="text-lg font-semibold text-center text-white">
                    Order Now
                  </Text>
                </View>
              </TouchableOpacity>
            </View>}
          </ScrollView>
        </Animated.View>

        {/* Bottom sheet for request details */}
        <ReusableBottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          backgroundStyle={{ backgroundColor: "#ffffff" }}
          handleIndicatorStyle={{ backgroundColor: "#888" }}
          keyboardShouldPersistTaps="handled"
          onChange={handleSheetChanges}
          onOpen={() => {
            console.log("Order sheet opened");
            setIsSheetOpen(true);
            fadeTo(1);
          }}
          onClose={() => {
            console.log("Order sheet closed");
            setIsSheetOpen(false);
            fadeTo(0);
          }}
        >
          <KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
          <KeyboardAwareScrollView
            className="px-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={20}
          >
            <Text className="mb-4 text-xl font-bold text-center">
              Request Details
            </Text>
            <Text className="mb-4 text-center text-gray-600">
              Please provide your order details below:
            </Text>

            {/* Delivery Method */}
            <View className="my-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                <Text className="text-red-500">* </Text>
                Delivery Method
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => handleInputChange("delivery_method", "pickup")}
                  className={`flex-1 p-3 rounded-lg border ${
                    requestForm.delivery_method === "pickup"
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      requestForm.delivery_method === "pickup"
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    Pickup
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    handleInputChange("delivery_method", "delivery")
                  }
                  className={`flex-1 p-3 rounded-lg border ${
                    requestForm.delivery_method === "delivery"
                      ? "bg-blue-100 border-blue-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      requestForm.delivery_method === "delivery"
                        ? "text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    Delivery
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Delivery method messages */}
              <Text className="mt-2 mb-4 text-sm text-gray-600">
                {requestForm.delivery_method === "pickup"
                  ? `You will send Your own truck for pickup.`
                  : `Mine owner will deliver material to you. Delivery charges will be added by Mine Owner.`}
              </Text>
            </View>

            {/* Delivery Location - Using your LocationInput component */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                <Text className="text-red-500">* </Text>
                Delivery Location
              </Text>
              <LocationInput
                onLocationSelect={handleLocationSelect}
                initialLocation={requestForm.delivery_location?.address}
              />
            </View>

            {/* Unit and Quantity Section */}
            <View className="mb-4" style={{ position: "relative" }}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-gray-700">
                  <Text className="text-red-500">* </Text>
                  Unit & Quantity
                </Text>
                {selectedUnitData && (
                  <Text className="text-sm text-gray-500">
                    Available: {selectedUnitData.stock_quantity}{" "}
                    {selectedUnitData.unit}
                  </Text>
                )}
              </View>

              <View className="flex-row gap-3">
                {/* Unit Dropdown - Smaller width */}
                <View
                  className="flex-1"
                  style={{ maxWidth: 120, position: "relative" }}
                >
                  <TouchableOpacity
                    onPress={() => setShowUnitDropdown(!showUnitDropdown)}
                    className="flex-row items-center justify-between p-4 bg-white border border-gray-300 rounded-lg shadow-xl"
                  >
                    <Text
                      className={`text-sm ${
                        requestForm.selected_unit
                          ? "text-black"
                          : "text-gray-400"
                      }`}
                      numberOfLines={1}
                    >
                      {requestForm.selected_unit || "Unit"}
                    </Text>
                    <Text className="ml-1 text-gray-500">
                      {showUnitDropdown ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>

                  {/* Dropdown Options - Absolute positioning */}
                  {showUnitDropdown && (
                    <View
                      className="bg-white border border-gray-300 rounded-lg shadow-xl"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 999,
                        marginTop: 4,
                      }}
                    >
                      {availableUnits.map((unitData, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleUnitSelect(unitData.unit)}
                          className={`p-3 ${
                            index < availableUnits.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }`}
                        >
                          <Text className="text-sm font-medium text-gray-700 capitalize">
                            {unitData.unit}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            ₹
                            {convertToIndianNumberSystem(
                              unitData.pricePerUnit.toFixed(2)
                            )}{" "}
                            per unit
                          </Text>
                          <Text className="text-xs text-gray-400">
                            Stock: {unitData.stock_quantity}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Quantity Input - Takes more space */}
                <View className="flex-1">
                  <TextInput
                    value={requestForm.quantity}
                    onChangeText={handleQuantityChange}
                    placeholder={
                      selectedUnitData
                        ? `Enter quantity (max ${selectedUnitData.stock_quantity})`
                        : "Select unit first"
                    }
                    placeholderTextColor={"#9ca3af"}
                    className={`p-4 text-black bg-white rounded-lg ${
                      quantityError
                        ? "border-red-500 bg-red-50"
                        : "border border-gray-300"
                    }`}
                    keyboardType="numeric"
                    maxLength={
                      selectedUnitData
                        ? selectedUnitData.stock_quantity.toString().length + 1
                        : 10
                    }
                    editable={!!requestForm.selected_unit}
                  />
                </View>
              </View>

              {!requestForm.selected_unit && (
                <Text className="mt-2 text-sm text-gray-400">
                  Please select a unit first to see available stock
                </Text>
              )}

              {/* Price Calculation with error message */}
              {requestForm.quantity &&
                requestForm.selected_unit &&
                selectedUnitData &&
                !isNaN(parseInt(requestForm.quantity)) && (
                  <View
                    className={`mt-3 p-3 rounded-lg ${
                      quantityError ? "bg-red-50" : "bg-blue-50"
                    }`}
                  >
                    {quantityError ? (
                      <Text className="font-medium text-red-600">
                        Quantity cannot exceed available stock of{" "}
                        {selectedUnitData.stock_quantity}{" "}
                        {selectedUnitData.unit}
                      </Text>
                    ) : (
                      <>
                        <Text className="text-base font-semibold text-gray-700">
                          Estimated Price:
                        </Text>
                        <Text className="text-lg font-bold text-blue-700">
                          ₹
                          {convertToIndianNumberSystem(
                            requestForm.calculated_price.toFixed(2)
                          )}
                        </Text>
                        <Text className="mt-1 text-sm text-gray-500">
                          For {requestForm.quantity} {requestForm.selected_unit}
                          (s) @ ₹
                          {convertToIndianNumberSystem(
                            selectedUnitData.pricePerUnit.toFixed(2)
                          )}{" "}
                          per unit
                        </Text>
                      </>
                    )}
                  </View>
                )}
            </View>

            {/* Comments - Preserve formatting */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Additional Comments
              </Text>
              <TextInput
                value={requestForm.comments}
                onChangeText={(value) => handleInputChange("comments", value)}
                placeholder="Any special instructions or requirements"
                className="p-4 mb-5 text-black bg-white border border-gray-300 rounded-lg"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />
            </View>

            {/* Price Confirmation */}
            <View className="mb-6">
              <TouchableOpacity
                onPress={() =>
                  handleInputChange(
                    "price_confirmed",
                    !requestForm.price_confirmed
                  )
                }
                className="flex-row items-center gap-3"
              >
                <View
                  className={`w-5 h-5 border-2 rounded ${
                    requestForm.price_confirmed
                      ? "bg-green-500 border-green-500"
                      : "border-gray-400"
                  }`}
                >
                  {requestForm.price_confirmed && (
                    <Text className="text-xs text-center text-white">✓</Text>
                  )}
                </View>
                <Text className="flex-1 text-base text-gray-700">
                  I confirm the pricing and agree to the terms *
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={handleBottomSheetClose}
                className="flex-1 p-3 bg-gray-500 rounded-lg"
              >
                <Text className="font-semibold text-center text-white">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitRequest}
                disabled={!isFormValid || isCreatingRequest}
                className={`flex-1 p-3 rounded-lg ${
                  !isFormValid || isCreatingRequest
                    ? "bg-gray-400"
                    : "bg-green-600"
                }`}
              >
                {isCreatingRequest ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-semibold text-center text-white">
                    Submit Request
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
          </KeyboardAvoidingView>
        </ReusableBottomSheet>
      </View>
    </GestureHandlerRootView>
  );
};

export default MaterialDetail;
