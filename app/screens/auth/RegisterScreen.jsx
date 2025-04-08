import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Pressable, BackHandler } from "react-native";
import { useRegisterUser } from "../../hooks/useAuth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useAuthStore } from "../../store/authStore";
import AntDesign from '@expo/vector-icons/AntDesign';
import Fontisto from '@expo/vector-icons/Fontisto';

const RegisterScreen = ({ route }) => {
  const phone = route.params.phoneNumber;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const navigation = useNavigation();
  const registerMutation = useRegisterUser();
  const [modalVisible, setModalVisible] = useState(false);
  const { setUser } = useAuthStore();
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);

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

  const validateEmail = (text) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const handleEmailBlur = () => {
    setEmailFocused(false);
    if (email.trim() === "") {
      setEmailError("Email is required.");
    } else if (!validateEmail(email)) {
      setEmailError("Invalid email format.");
    } else {
      setEmailError("");
    }
  };

  const handleNameChange = (text) => {
    setName(text);
    if (text.trim() === "") {
      setNameError("Name is required.");
    } else {
      setNameError("");
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    setEmailError("");
  };

  const handleRegister = () => {
    if (!name || !email || !role || Boolean(nameError) || Boolean(emailError)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields correctly and select a role.",
      });
      return;
    }

    registerMutation.mutate(
      { name, email, phone, role },
      {
        onSuccess: (data) => {
          setUser(data.user, data.accessToken);
          if (role === "driver") {
            navigation.navigate("AddTruck");
          } else {
            navigation.navigate("Main");
          }
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: error.response.data.message,
          });
        },
      }
    );
  };

  const handleRoleSelection = (selectedRole) => {
    setRole(selectedRole);
    setModalVisible(false);
  };

  const isRegisterDisabled = !name || !email || !role || Boolean(nameError) || Boolean(emailError);

  return (
    <View className="flex-1 bg-black">
      <View className="relative h-[30%] items-center justify-center bg-black">
        <Image
          source={require("../../../assets/Dark.png")}
          className="w-56 h-56"
        />
      </View>

      <View className="flex-1 p-6 bg-white rounded-t-3xl">
        <Text className="mb-4 text-2xl font-bold">Register</Text>

        <View className="flex-row items-center px-4 py-4 bg-gray-100 rounded-lg shadow-sm">
          <AntDesign name="user" size={18} color="black" className="mr-3" />
          <TextInput
            placeholder="Name"
            placeholderTextColor="#A0A0A0"
            value={name}
            onChangeText={handleNameChange}
            className="flex-1 ml-2 text-black"
            onBlur={() => {
              if (name.trim() === "") {
                setNameError("Name is required.");
              }
            }}
          />
        </View>
        {nameError && <Text className="mb-4 text-red-500">{nameError}</Text>}

        <View className="flex-row items-center px-4 py-4 mt-8 bg-gray-100 rounded-lg shadow-sm">
          <Fontisto name="email" size={18} color="black" className="mr-3" />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            className="flex-1 ml-2 text-black"
            onBlur={handleEmailBlur}
            onFocus={() => setEmailFocused(true)}
          />
        </View>
        {emailError && <Text className="mb-4 text-red-500">{emailError}</Text>}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="p-4 mt-8 mb-4 text-black bg-gray-100 rounded-lg"
        >
          <Text className="text-black">
            {role ? role == "driver" ? "Driver" : "Truck Owner" : "Select Role"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRegister}
          className={`flex items-center p-4 rounded-lg ${
            isRegisterDisabled ? "bg-gray-400" : "bg-black"
          }`}
          disabled={isRegisterDisabled}
        >
          <Text className={`text-lg font-bold ${isRegisterDisabled ? "text-gray-600" : "text-white"}`}>
            Register
          </Text>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View className="items-center justify-center flex-1 bg-black/50">
            <View className="p-6 bg-white rounded-lg w-[80%]">
              <Text className="mb-4 text-xl font-bold">Select Role</Text>
              <TouchableOpacity
                onPress={() => handleRoleSelection("driver")}
                className="p-3 mb-2 bg-gray-100 rounded-lg"
              >
                <Text>Driver</Text>
                <Text className="text-xs text-gray-500">Employed driver for mine material delivery.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRoleSelection("truck_owner")}
                className="p-3 bg-gray-100 rounded-lg"
              >
                <Text>Truck Owner</Text>
                <Text className="text-xs text-gray-500">Owner of trucks for material delivery.</Text>
              </TouchableOpacity>
              <Pressable
                style={{ marginTop: 10, alignSelf: 'flex-end' }}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={{ color: 'blue' }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

export default RegisterScreen;