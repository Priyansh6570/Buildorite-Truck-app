import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  BackHandler,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useUpdateTruck, useFetchMyTruck } from "../../hooks/useTruck";
import Toast from "react-native-toast-message";
import {
  FontAwesome5,
  FontAwesome6,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";

const VehicleSettingsScreen = () => {
  const navigation = useNavigation();
  const { data: myTruck, isLoading: isFetchingTruck } = useFetchMyTruck();
  const { mutate: updateTruck, isLoading: isUpdatingTruck } = useUpdateTruck();

  const [model, setModel] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationTouched, setRegistrationTouched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [changesMade, setChangesMade] = useState(false);
  const [submittedUpdate, setSubmittedUpdate] = useState(false);

  useEffect(() => {
    if (myTruck) {
      setModel(myTruck.name || "");
      setRegistrationNumber(myTruck.registration_number || "");
    }
  }, [myTruck]);

  useEffect(() => {
    if (
      model !== (myTruck?.name || "") ||
      registrationNumber !== (myTruck?.registration_number || "")
    ) {
      setChangesMade(true);
    } else {
      setChangesMade(false);
    }
  }, [model, registrationNumber, myTruck]);

  useEffect(() => {
    if (registrationTouched && registrationNumber) {
      const error = validateRegistrationNumber(registrationNumber);
      setRegistrationError(error);
    }
  }, [registrationNumber, registrationTouched]);

  const validateRegistrationNumber = (number) => {
    if (!number || !number.trim()) return "Registration number is required";
    const pattern1 = /^[A-Z]{2}[ -]{0,1}[0-9]{2}[ -]{0,1}[A-Z]{1,2}[ -]{0,1}[0-9]{4}$/;
    const pattern2 = /^[0-9]{2}[ -]{0,1}BH[ -]{0,1}[0-9]{4}[ -]{0,1}[A-Z]{1,2}$/;

    const upperCaseNumber = number.toUpperCase();

    if (!pattern1.test(upperCaseNumber) && !pattern2.test(upperCaseNumber)) {
      return "Please enter a valid registration number format";
    }
    return "";
  };

  const checkForUnsavedChanges = useCallback(() => {
    if (changesMade && !submittedUpdate) {
      setShowModal(true);
      return true;
    }
    return false;
  }, [changesMade, submittedUpdate]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          return checkForUnsavedChanges();
        }
      );
      return () => backHandler.remove();
    }, [checkForUnsavedChanges])
  );

  const handleBackPress = () => {
    if (!checkForUnsavedChanges()) {
      navigation.goBack();
    }
  };

  const handleRegistrationChange = (text) => {
    setRegistrationNumber(text);
    if (registrationTouched) {
      const error = validateRegistrationNumber(text);
      setRegistrationError(error);
    }
  };

  const handleRegistrationBlur = () => {
    setRegistrationTouched(true);
    const error = validateRegistrationNumber(registrationNumber);
    setRegistrationError(error);
  };

  const isFormValid = () => {
    return (
      !registrationError &&
      model.trim() &&
      registrationNumber.trim() &&
      (registrationNumber ? !validateRegistrationNumber(registrationNumber) : true)
    );
  };

  const handleUpdate = () => {
    if (!isFormValid()) {
      if (registrationNumber && validateRegistrationNumber(registrationNumber)) {
        setRegistrationTouched(true);
      }
      if (!model.trim()) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2: "Vehicle model cannot be empty",
        });
      }
      return;
    }

    setSubmittedUpdate(true);
    const truckData = {
      name: model,
      registration_number: registrationNumber.toUpperCase().replace(/\s/g, ""),
    };

    updateTruck(
      { id: myTruck._id, truckData },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Vehicle details updated successfully!",
          });
          navigation.goBack();
        },
        onError: (err) => {
          setSubmittedUpdate(false);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: err?.response?.data?.message || "Failed to update vehicle details",
          });
        },
      }
    );
  };

  if (isFetchingTruck) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" color="#1F2937" />
        <Text className="mt-2 text-lg text-gray-600">Loading Vehicle Details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView className="flex-1 bg-white">
          <View className="flex-row items-center justify-center px-8 py-16 bg-gray-900">
            <TouchableOpacity
              onPress={handleBackPress}
              className="absolute left-8 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
            >
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text className="ml-4 text-3xl font-black text-center text-white">
              Vehicle Settings
            </Text>
          </View>

          <View className="px-6 mb-12">
            <View className="p-8 -mt-6 bg-white shadow-2xl rounded-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-semibold text-gray-700">
                  Vehicle Update
                </Text>
                <Ionicons name="information-circle" size={24} color="#1F2937" />
              </View>
              <Text className="text-sm text-gray-600">
                Update your vehicle details below. Make sure to enter accurate
                information for proper identification and service delivery.
              </Text>
            </View>

            <View className="p-8 py-10 mt-6 bg-white border shadow-sm rounded-3xl border-slate-100">
              <View className="flex-row items-start mb-6">
                <View className="mr-5 overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={["#3B82F6", "#1D4ED8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-4"
                  >
                    <FontAwesome5 name="truck" size={20} color="#ffffff" />
                  </LinearGradient>
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    Vehicle Information
                  </Text>
                  <Text className="text-base text-gray-500">
                    Update your vehicle details
                  </Text>
                </View>
              </View>

              <Text className="my-2 text-base font-semibold text-gray-700">
                Vehicle Model
              </Text>
              <View className="relative mb-6">
                <TextInput
                  className="w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl"
                  placeholder="Enter vehicle model (e.g., TATA Ace)"
                  placeholderTextColor="#9CA3AF"
                  value={model}
                  onChangeText={setModel}
                />
                <FontAwesome6
                  name="truck"
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 16, top: 24 }}
                />
              </View>

              <Text className="mb-2 text-base font-semibold text-gray-700">
                Registration Number
              </Text>
              <View className="relative mb-2">
                <TextInput
                  className={`w-full h-[68px] p-4 px-6 text-gray-700 border rounded-xl bg-gray-50 text-xl ${
                    registrationError && registrationTouched
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="(e.g., MP09XY1234)"
                  placeholderTextColor="#9CA3AF"
                  value={registrationNumber}
                  onChangeText={handleRegistrationChange}
                  onBlur={handleRegistrationBlur}
                  autoCapitalize="characters"
                />
                <MaterialIcons
                  name="confirmation-number"
                  size={20}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 16, top: 24 }}
                />
              </View>
              {registrationError && registrationTouched && (
                <Text className="mb-6 text-base text-red-500">
                  {registrationError}
                </Text>
              )}
              {!registrationError && <View className="mb-6" />}
            </View>
          </View>

        </ScrollView>
          <View className="absolute bottom-0 w-full px-6 py-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              onPress={handleUpdate}
              className={`h-[56px] justify-center items-center rounded-xl mb-2 ${
                isFormValid() && changesMade ? "bg-[#1F2937]" : "bg-gray-400"
              }`}
              disabled={!isFormValid() || isUpdatingTruck || !changesMade}
            >
              {isUpdatingTruck ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-sm text-center text-gray-500">
              Changes will be saved to your vehicle profile
            </Text>
          </View>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-[rgba(0,0,0,0.5)]">
          <View className="w-[90%] p-8 bg-white rounded-2xl shadow-2xl">
            <View className="items-center mb-6">
              <View className="p-4 mb-4 bg-blue-100 rounded-full">
                <MaterialIcons name="warning" size={32} color="#3B82F6" />
              </View>
              <Text className="mb-2 text-2xl font-bold text-gray-900">
                Unsaved Changes
              </Text>
              <Text className="text-lg text-center text-gray-600">
                You have unsaved changes to your vehicle details. Are you sure you want to leave without saving?
              </Text>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => {
                  setShowModal(false);
                  setSubmittedUpdate(true);
                  navigation.goBack();
                }}
                className="flex-1 h-[56px] justify-center items-center border-2 border-gray-300 rounded-xl"
              >
                <Text className="text-lg font-semibold text-gray-700">
                  Leave
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowModal(false)}
                className="flex-1 h-[56px] justify-center items-center bg-[#1F2937] rounded-xl"
              >
                <Text className="text-lg font-semibold text-white">Stay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VehicleSettingsScreen;