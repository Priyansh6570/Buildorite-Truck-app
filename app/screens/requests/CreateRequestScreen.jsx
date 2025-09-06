import React, { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons, FontAwesome, FontAwesome6, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";

import { useCreateRequest } from "../../hooks/useRequest";
import LocationInput from "../../components/Ui/LocationInput";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import DatePicker from "react-native-date-picker";
import DocumentUploader from "../../components/Ui/DocumentUploader";

const UnitDropdown = ({ prices, onSelect, selectedPriceInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setIsOpen(!isOpen)} className="flex-row items-center justify-between w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50">
        <Text className="text-xl text-gray-800">{selectedPriceInfo ? selectedPriceInfo.unit.name : "Select a Unit"}</Text>
        <MaterialIcons name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#9CA3AF" />
      </TouchableOpacity>
      {isOpen && (
        <View className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg top-full rounded-xl max-h-[168px]">
          <ScrollView nestedScrollEnabled={true}>
            {prices.map((priceInfo) => (
              <TouchableOpacity
                activeOpacity={0.8}
                key={priceInfo._id}
                onPress={() => {
                  onSelect(priceInfo);
                  setIsOpen(false);
                }}
                className="p-4 border-b border-gray-100"
              >
                <Text className="text-base">{priceInfo.unit.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const CreateRequestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { mine, material } = route.params;

  const [selectedPriceInfo, setSelectedPriceInfo] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [createRequestPress, setCreateRequestPress] = useState(false);

  const scheduleSheetRef = useRef(null);
  const [tempDate, setTempDate] = useState(new Date());

  const { mutate: createRequest, isLoading } = useCreateRequest();

  useEffect(() => {
    if (material?.prices?.length === 1) {
      handlePriceInfoSelect(material.prices[0]);
    }
  }, [material]);

  const handlePriceInfoSelect = (priceInfo) => {
    setSelectedPriceInfo(priceInfo);
    const minQty = priceInfo.minimum_order_quantity.toString();
    setQuantity(minQty);
    validateQuantity(minQty, priceInfo);
  };

  const handleQuantityChange = (value) => {
    setQuantity(value);
    validateQuantity(value, selectedPriceInfo);
  };

  const validateQuantity = (qty, priceInfo) => {
    if (!priceInfo) return;
    const numQty = parseInt(qty, 10);
    if (isNaN(numQty) || qty.trim() === "") {
      setQuantityError("Please enter a valid number.");
    } else if (numQty < priceInfo.minimum_order_quantity) {
      setQuantityError(`Minimum order is ${priceInfo.minimum_order_quantity}.`);
    } else if (numQty > priceInfo.stock_quantity) {
      setQuantityError(`Not enough stock. Available: ${priceInfo.stock_quantity}.`);
    } else {
      setQuantityError("");
    }
  };

  const calculatedPrice = useMemo(() => {
    if (!selectedPriceInfo || !quantity || quantityError) return "0.00";
    return (parseFloat(quantity) * selectedPriceInfo.price).toFixed(2);
  }, [quantity, selectedPriceInfo, quantityError]);

  const isFormValid = useMemo(() => {
    if (!selectedPriceInfo || !quantity || quantityError || isLoading || !schedule) return false;
    if (!deliveryLocation) return false;
    return true;
  }, [selectedPriceInfo, quantity, quantityError, deliveryMethod, deliveryLocation, schedule, isLoading]);

  const handleSubmit = () => {
    setCreateRequestPress(true);
    if (!isFormValid) return;
    const requestData = {
      mine_id: mine._id,
      material_id: material._id,
      proposal: {
        unit: selectedPriceInfo.unit._id,
        quantity: parseFloat(quantity),
        price: parseFloat(calculatedPrice),
        delivery_method: deliveryMethod,
        comments,
        attachments,
        delivery_location: deliveryLocation,
        ...(schedule && { schedule: { date: schedule } }),
      },
    };
    createRequest(requestData, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: "Request Created",
          text2: "Your request has been successfully created.",
        });
        navigation.goBack();
      },
      onError: (error) => console.error("Failed to create request:", error),
      onSettled: () => {
        setCreateRequestPress(false);
      },
    });
  };

  const openScheduleSheet = () => scheduleSheetRef.current?.snapToIndex(0);
  const closeScheduleSheet = () => scheduleSheetRef.current?.close();
  const handleScheduleConfirm = () => {
    setSchedule(tempDate);
    closeScheduleSheet();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="bg-gray-900" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-center px-8 py-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-8 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-white">Create Request</Text>
        </View>
      </View>

      <View className="flex-1 bg-slate-100">
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }} className="flex-1 p-4">
          <View className="p-6 py-8 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
            <View className="flex-row items-start mb-8">
              <View className="mr-4 overflow-hidden rounded-2xl">
                <LinearGradient colors={["#60a5fa", "#3b82f6"]} className="p-4">
                  <FontAwesome6 name="weight-hanging" size={20} color="#ffffff" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Order Details</Text>
                <Text className="text-base text-gray-500">Select unit, quantity, and confirm price</Text>
              </View>
            </View>

            <Text className="mb-2 text-base font-semibold text-gray-700">Unit</Text>
            {material?.prices?.length > 1 ? (
              <UnitDropdown prices={material.prices} onSelect={handlePriceInfoSelect} selectedPriceInfo={selectedPriceInfo} />
            ) : (
              <View className="w-full h-[68px] p-4 px-6 justify-center text-gray-700 border border-gray-300 rounded-xl bg-gray-50">
                <Text className="text-xl text-gray-800">{selectedPriceInfo?.unit?.name || "N/A"}</Text>
              </View>
            )}

            <Text className="mt-8 mb-4 text-base font-semibold text-gray-700">Quantity</Text>
            <View className={`flex-row items-center w-full h-[68px] border border-gray-300 rounded-xl bg-gray-50 ${!selectedPriceInfo ? "opacity-50" : ""}`}>
              <TextInput value={quantity} onChangeText={handleQuantityChange} placeholder="Enter quantity" keyboardType="numeric" className="flex-1 ml-6 text-xl font-bold text-gray-900" editable={!!selectedPriceInfo} />
            </View>
            {quantityError && <Text className="mt-2 text-red-600">{quantityError}</Text>}

            {!quantityError && selectedPriceInfo && quantity > 0 && (
              <View className="p-6 mt-5 border border-blue-200 rounded-2xl bg-blue-50">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-blue-700">{`${quantity} ${selectedPriceInfo?.unit?.name} × ₹${selectedPriceInfo?.price.toFixed(2)}`}</Text>
                  <Text className="text-2xl font-bold text-blue-900">
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(calculatedPrice)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="p-6 py-8 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
            <View className="flex-row items-start mb-8">
              <View className="mr-4 overflow-hidden rounded-2xl">
                <LinearGradient colors={["#fb923c", "#f97316"]} className="p-4">
                  <FontAwesome name="truck" size={20} color="#ffffff" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Delivery</Text>
                <Text className="text-base text-gray-500">Choose pickup or delivery</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity activeOpacity={0.8} onPress={() => setDeliveryMethod("pickup")} className={`flex-1 p-8 rounded-xl border-2 ${deliveryMethod === "pickup" ? "bg-orange-50 border-orange-500" : "bg-gray-100 border-gray-100"}`}>
                <Text className={`font-bold text-xl ${deliveryMethod === "pickup" ? "text-orange-600" : "text-gray-800"}`}>Pickup</Text>
                <Text className={`text-md mt-1 ${deliveryMethod === "pickup" ? "text-orange-500" : "text-gray-500"}`}>You will collect</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} onPress={() => setDeliveryMethod("delivery")} className={`flex-1 p-8 rounded-xl border-2 ${deliveryMethod === "delivery" ? "bg-orange-50 border-orange-500" : "bg-gray-100 border-gray-100"}`}>
                <Text className={`font-bold text-xl ${deliveryMethod === "delivery" ? "text-orange-600" : "text-gray-800"}`}>Delivery</Text>
                <Text className={`text-md mt-1 ${deliveryMethod === "delivery" ? "text-orange-500" : "text-gray-500"}`}>We will deliver</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-6">
              <Text className="mb-2 text-base font-semibold text-gray-700">Delivery Location</Text>
              <LocationInput onLocationSelect={(loc) => setDeliveryLocation(loc)} />
            </View>
          </View>

          <View className="p-6 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
            <View className="flex-row items-start mb-6">
              <View className="mr-4 overflow-hidden rounded-2xl">
                <LinearGradient colors={["#2dd4bf", "#14b8a6"]} className="p-4">
                  <MaterialIcons name="event-available" size={20} color="#ffffff" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Schedule</Text>
                <Text className="text-base text-gray-500">Select your preferred date (Required)</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openScheduleSheet} className="flex-row items-center justify-between w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50">
              <Text className="text-xl text-gray-800">
                {schedule
                  ? new Date(schedule).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Select a date"}
              </Text>
              <MaterialIcons name="calendar-today" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View className="p-6 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
            <View className="flex-row items-start mb-6">
              <View className="mr-4 overflow-hidden rounded-2xl">
                <LinearGradient colors={["#a78bfa", "#8b5cf6"]} className="p-4">
                  <MaterialIcons name="more-horiz" size={20} color="#ffffff" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900">Optional Details</Text>
                <Text className="text-base text-gray-500">Add comments or files if needed</Text>
              </View>
            </View>

            <Text className="mb-2 text-base font-semibold text-gray-700">Comments</Text>
            <TextInput value={comments} onChangeText={setComments} placeholder="Add any specific details..." multiline className="h-32 p-4 px-6 text-xl border border-gray-300 bg-gray-50 rounded-xl" textAlignVertical="top" />
            <Text className="mt-4 mb-2 text-base font-semibold text-gray-700">Attachments</Text>
            <DocumentUploader onUpload={(files) => setAttachments(files)} />
          </View>

          <TouchableOpacity activeOpacity={0.8} onPress={handleSubmit} disabled={!isFormValid} className={`flex-row items-center justify-center p-5 mb-14 mt-6 rounded-2xl ${isFormValid ? "bg-gray-800" : "bg-gray-400"}`}>
            {createRequestPress ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="send" size={18} color="white" />
                <Text className="ml-3 text-xl font-bold text-white">Send Request</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
      <ReusableBottomSheet ref={scheduleSheetRef} snapPoints={["65%"]}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-gray-100 rounded-full">
              <MaterialIcons name="calendar-today" size={28} color="#374151" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Select Preferred Date</Text>
          </View>
          <View className="items-center justify-center flex-1 mb-8">
            <DatePicker date={tempDate} onDateChange={setTempDate} mode="date" minimumDate={new Date()} style={{ alignSelf: "center" }} theme="light" />
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity onPress={handleScheduleConfirm} className="p-4 bg-gray-800 rounded-2xl">
              <Text className="text-lg font-bold text-center text-white">Set Date</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeScheduleSheet} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

export default CreateRequestScreen;
