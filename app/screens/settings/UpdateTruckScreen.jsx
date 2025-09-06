// src/screens/UpdateTruckScreen.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUpdateTruck, useFetchMyTruck } from "../../hooks/useTruck";
import Toast from "react-native-toast-message";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const UpdateTruckScreen = () => {
  const navigation = useNavigation();
  const { data: truckData, isLoading: isFetchingTruck, isError: isFetchingError } = useFetchMyTruck();
  const updateTruckMutation = useUpdateTruck();

  const [name, setName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [nameError, setNameError] = useState(null);
  const [registrationNumberError, setRegistrationNumberError] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    if (truckData && truckData._id) {
      setName(truckData.name || "");
      setRegistrationNumber(truckData.registration_number || "");
    }
  }, [truckData]);

  useEffect(() => {
    setIsButtonDisabled(updateTruckMutation.isLoading || name.trim() === "" || registrationNumber.trim() === "" || Boolean(registrationNumberError) || Boolean(nameError));
  }, [updateTruckMutation.isLoading, name, registrationNumber, registrationNumberError, nameError]);

  const validateRegistrationNumber = (number) => {
    if (!number.trim()) {
      return "Registration number is required.";
    }

    const pattern1 = /^[A-Z]{2}[ -]{0,1}[0-9]{2}[ -]{0,1}[A-HJ-NP-Z]{1,2}[ -]{0,1}[0-9]{4}$/;
    const pattern2 = /^[0-9]{2}[ -]{0,1}BH[ -]{0,1}[0-9]{4}[ -]{0,1}[A-HJ-NP-Z]{1,2}$/;

    if (!pattern1.test(number.trim().toUpperCase()) && !pattern2.test(number.trim().toUpperCase())) {
      return "Invalid registration number format.";
    }
    return null;
  };

  const handleRegistrationNumberBlur = () => {
    const error = validateRegistrationNumber(registrationNumber);
    setRegistrationNumberError(error);
  };

  const handleNameBlur = () => {
    if (Boolean(name.trim()) === false) {
      setNameError("Truck name is required.");
    } else {
      setNameError(null);
    }
  };

  const isFormValid = () => {
    return !nameError && !registrationNumberError && name.trim() !== "" && registrationNumber.trim() !== "";
  };

  const handleUpdate = () => {
    if (!isFormValid()) {
      handleNameBlur();
      handleRegistrationNumberBlur();
      return;
    }

    const updateData = {
      name: name.trim(),
      registration_number: registrationNumber.trim().toUpperCase().replace(/\s/g, ""),
    };
    updateTruckMutation.mutate({ id: truckData._id, truckData: updateData });
    Toast.show({
      type: "success",
      text1: "Truck updated successfully.",
      position: "top",
      visibilityTime: 2000,
    });

    navigation.goBack();
  };

  if (isFetchingTruck) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (isFetchingError) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <Text className="text-lg text-red-500">Failed to fetch truck details.</Text>
      </View>
    );
  }

  if (!truckData) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <Text className="text-lg text-gray-700">No truck data available.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 pb-6 bg-gray-100" style={{ height: "25%" }}>
        <TouchableOpacity onPress={navigation.goBack} className="absolute left-0 z-10 p-6">
          <Text className="text-4xl font-bold">&#8592;</Text>
        </TouchableOpacity>

        <View className="items-center justify-center p-4">
          <Text className="text-2xl font-bold text-black">Update Truck</Text>
        </View>

        <View className="px-6 mt-12">
          <Text className="mb-2 text-lg font-semibold text-black">Update Truck Details</Text>
          <Text className="text-gray-600">You can update your truck's name and registration number below.</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 bg-white" style={{ height: "75%" }}>
        <Text className="mb-2 text-lg font-bold text-black">Truck Name</Text>
        <View className="flex-row items-center px-4 py-4 mb-2 bg-white rounded-lg shadow-md">
          <MaterialCommunityIcons name="truck" size={20} color="black" className="mr-3" />
          <TextInput value={name} onChangeText={setName} placeholder="Enter truck name" placeholderTextColor="#A0A0A0" className="flex-1 ml-2 text-black" onBlur={handleNameBlur} />
        </View>
        {nameError && <Text className="mb-4 text-xs text-red-500">{nameError}</Text>}

        <Text className="mb-2 text-lg font-bold text-black">Registration Number</Text>
        <View className="flex-row items-center px-4 py-4 mb-2 bg-white rounded-lg shadow-md">
          <Image source={require("../../../assets/icons/number-plate.png")} style={{ width: 24, height: 24, marginRight: 12 }} resizeMode="contain" />
          <TextInput value={registrationNumber} onChangeText={setRegistrationNumber} placeholder="example: MP04XY1234" placeholderTextColor="#A0A0A0" className="flex-1 ml-2 text-black" onBlur={handleRegistrationNumberBlur} autoCapitalize="characters" />
        </View>
        {registrationNumberError && <Text className="mb-4 text-xs text-red-500">{registrationNumberError}</Text>}

        <TouchableOpacity onPress={handleUpdate} className={`p-4 mt-4 mb-8 rounded-lg shadow-md ${isFormValid() ? "bg-black" : "bg-gray-400"}`} disabled={isButtonDisabled}>
          {updateTruckMutation.isLoading ? <ActivityIndicator color="#fff" /> : <Text className="font-bold text-center text-white">Update Truck</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default UpdateTruckScreen;
