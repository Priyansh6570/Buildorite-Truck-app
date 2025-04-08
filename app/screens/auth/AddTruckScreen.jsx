import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAddTruck } from '../../hooks/useTruck';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const AddTruckScreen = () => {
  const navigation = useNavigation();
  const { mutate: addTruck, isLoading: isAddingTruck, isError, error, reset: resetAddTruck } = useAddTruck();
  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [location, setLocation] = useState(null);
  const [locationErrorMsg, setLocationErrorMsg] = useState(null);
  const [nameError, setNameError] = useState(null);
  const [registrationNumberError, setRegistrationNumberError] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true;
      });

      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({
      headerLeft: null,
      gestureEnabled: false,
    });
  }, [navigation]);

  const getLocation = async () => {
    setIsLocationLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setLocationErrorMsg('Location permission is needed to proceed.');
      setIsLocationLoading(false);
      return;
    }

    try {
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);
      setLocationErrorMsg(null);
    } catch (err) {
      setLocationErrorMsg('Failed to get location. Please try again.');
    } finally {
      setIsLocationLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    setIsButtonDisabled(isAddingTruck || !name.trim() || !registrationNumber.trim() || !location || registrationNumberError);
    if (isError) {
      setIsButtonDisabled(false);
    }
  }, [isAddingTruck, name, registrationNumber, location, isError, registrationNumberError]);

  const validateRegistrationNumber = (number) => {
    if (!number.trim()) {
      return 'Registration number is required.';
    }

    const pattern1 = /^[A-Z]{2}[ -]{0,1}[0-9]{2}[ -]{0,1}[A-HJ-NP-Z]{1,2}[ -]{0,1}[0-9]{4}$/;
    const pattern2 = /^[0-9]{2}[ -]{0,1}BH[ -]{0,1}[0-9]{4}[ -]{0,1}[A-HJ-NP-Z]{1,2}$/;

    if (!pattern1.test(number.trim().toUpperCase()) && !pattern2.test(number.trim().toUpperCase())) {
      return 'Invalid registration number format.';
    }
    return null;
  };

  const handleRegistrationNumberBlur = () => {
    const error = validateRegistrationNumber(registrationNumber);
    setRegistrationNumberError(error);
  };

  const validateInputs = () => {
    let isValid = true;
    if (!name.trim()) {
      setNameError('Truck name is required.');
      isValid = false;
    } else {
      setNameError(null);
    }

    const regNumError = validateRegistrationNumber(registrationNumber);
    setRegistrationNumberError(regNumError);
    if (regNumError) {
      isValid = false;
    }

    return isValid;
  };

  const handleAddTruck = () => {
    if (!validateInputs()) {
      return;
    }

    if (!location) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Current location not available. Please ensure location is enabled.',
      });
      return;
    }

    setIsButtonDisabled(true);
    const current_location = {
      lat: location.latitude,
      long: location.longitude,
    };

    addTruck(
      { name: name.trim(), registration_number: registrationNumber.trim().toUpperCase().replace(/\s/g, ''), current_location },
      {
        onSuccess: (data) => {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Truck added successfully!',
          });
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'DBNav' }],
            });
          }, 300);
        },
        onError: (err) => {
          setIsButtonDisabled(false);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: err?.response?.data?.message || 'Failed to add truck.',
          });
        },
      }
    );
  };
  
  return (
    <ScrollView className="flex-1 bg-white">
      <View className="relative h-[30%] items-center justify-center bg-black">
        <Image
          source={require("../../../assets/Dark.png")}
          className="w-56 h-56"
        />
      </View>

      <View className="flex-1 p-6 bg-white rounded-t-3xl mt-[-20px]">
        <Text className="mb-4 text-2xl font-bold">Add Truck</Text>

        {/* Truck Name Input */}
        <Text className="my-2 text-black">Truck Name</Text>
        <View className="flex-row items-center px-4 py-4 mb-4 bg-white rounded-lg shadow-md">
          <MaterialCommunityIcons name="truck-fast-outline" size={24} color="black" className="mr-3" />
          <TextInput
            placeholder="Enter truck name"
            value={name}
            onChangeText={setName}
            className="flex-1 ml-2 text-black"
          />
        </View>
        {nameError && <Text className="mb-2 text-xs text-red-500">{nameError}</Text>}

        <Text className="mt-2 mb-2 text-black">Registration Number</Text>
        <View className="flex-row items-center px-4 py-4 mb-4 bg-white rounded-lg shadow-md">
          <Image
            source={require("../../../assets/icons/number-plate.png")}
            style={{ width: 24, height: 24, marginRight: 12 }}
            resizeMode="contain"
          />
          <TextInput
            placeholder="example: MP04XY1234"
            value={registrationNumber}
          onChangeText={setRegistrationNumber}
          onBlur={handleRegistrationNumberBlur}
          autoCapitalize="characters"
            className="flex-1 ml-2 text-black"
          />
        </View>
        {registrationNumberError && <Text className="mb-2 text-xs text-red-500">{registrationNumberError}</Text>}

        <View className="mb-4">
          <Text className="my-2 text-gray-700">Current Location:</Text>
          {isLocationLoading ? (
            <ActivityIndicator size="small" color="black" />
          ) : locationErrorMsg ? (
            <View>
              <Text className="text-sm text-red-500">{locationErrorMsg}</Text>
              <TouchableOpacity onPress={getLocation} className="mt-2">
                <Text className="text-sm text-blue-500 underline">Request Location Permission Again</Text>
              </TouchableOpacity>
            </View>
          ) : location ? (
            <Text className="text-sm text-green-500">Location acquired</Text>
          ) : (
            <Text className="text-sm text-yellow-500">Fetching location...</Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAddTruck}
          className={`flex items-center p-4 rounded-lg ${isButtonDisabled ? 'bg-gray-400' : 'bg-black'}`}
          disabled={isButtonDisabled}
        >
          {isAddingTruck ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-lg font-bold text-white">Add Truck</Text>
          )}
        </TouchableOpacity>

        {isError && error?.response?.data?.message && (
          <Text className="mt-4 text-red-500">{error.response.data.message}</Text>
        )}
      </View>
    </ScrollView>
  );
};

export default AddTruckScreen;