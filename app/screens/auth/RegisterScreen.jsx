import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRegisterUser } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

const RegisterScreen = ({ route }) => {
  // --- STATE MANAGEMENT ---
  const { phoneNumber, role } = route.params;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();
  const registerMutation = useRegisterUser();
  const { setUser, clearUser, user } = useAuthStore();

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => true;
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => backHandler.remove();
    }, [])
  );

  // --- LOGIC ---
  const handleRegister = () => {
    const userRole = role || "truck_owner";

    if (!name.trim() || !email.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please fill in all fields.",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: "error",
        text1: "Invalid Email",
        text2: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    registerMutation.mutate(
      { name, email, phone: phoneNumber, role: userRole },
      {
        onSuccess: (data) => {
          clearUser();
          setUser({name, email, phone: phoneNumber, role: userRole}, data.accessToken);
          console.log("User registered successfully:", email);
          Toast.show({
            type: "success",
            text1: "Registration Successful",
            text2: "Welcome to Buildorite!",
          });

          if (userRole === "driver") {
            navigation.reset({ index: 0, routes: [{ name: "AddTruck" }] });
          } else {
            navigation.reset({ index: 0, routes: [{ name: "Main" }] });
          }
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: "Registration Failed",
            text2:
              error.response?.data?.message || "An unexpected error occurred.",
          });
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  // --- UI COMPONENTS ---
  const SecureAuthSection = () => (
    <View className="my-6 overflow-hidden border-2 shadow-sm rounded-2xl border-slate-100">
      <LinearGradient
        colors={["#F0FDF4", "#f0f9ff"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        className="flex-row items-center p-6"
      >
        <View className="mr-4 overflow-hidden shadow-sm rounded-xl">
          <LinearGradient
            colors={["#21C25C", "#17A54B"]}
            className="items-center justify-center w-16 h-16"
          >
            <FontAwesome5 name="lock" size={20} color="white" />
          </LinearGradient>
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">
            Secure Onboarding
          </Text>
          <Text className="text-gray-600 text-md">
            Your information is safe with us
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderRegisterForm = () => (
    <View>
      <View
        className="p-10 bg-white border rounded-3xl border-slate-100"
        style={{ elevation: 5, shadowColor: "#00000050" }}
      >
        <Text className="mb-4 text-3xl font-bold text-center text-gray-800">
          Complete Registration
        </Text>
        <Text className="mb-8 text-lg font-semibold text-center text-slate-500">
          Fill in your details to get started
        </Text>

        {/* Full Name Input */}
        <Text className="mb-2 font-semibold text-gray-800">Full Name</Text>
        <View
          className={`flex-row px-4 pt-3 pb-2 max-h-20 items-center bg-white border rounded-2xl ${
            isNameFocused ? "border-blue-500 border-2" : "border-slate-200"
          }`}
        >
          <View className="overflow-hidden shadow-sm rounded-xl">
            <LinearGradient
              colors={["#8754F4", "#8248F1"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              className="items-center justify-center p-3"
            >
              <FontAwesome5 name="user-alt" size={14} color="white" />
            </LinearGradient>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
            className="flex-1 p-3 text-lg font-semibold text-gray-800"
            onFocus={() => setIsNameFocused(true)}
            onBlur={() => setIsNameFocused(false)}
            returnKeyType="next"
          />
        </View>

        {/* Email Address Input */}
        <Text className="mt-8 mb-2 font-semibold text-gray-800">
          Email Address
        </Text>
        <View
          className={`flex-row px-4 pt-3 pb-2 items-center max-h-20 bg-white border rounded-2xl ${
            isEmailFocused ? "border-blue-500 border-2" : "border-slate-200"
          }`}
        >
          <View className="overflow-hidden shadow-sm rounded-xl">
            <LinearGradient
              colors={["#3579F3", "#3A6FF1"]}
              className="items-center justify-center p-3"
            >
              <Ionicons name="mail" size={16} color="white" />
            </LinearGradient>
          </View>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email address"
            placeholderTextColor="#9CA3AF"
            className="flex-1 p-3 text-lg font-semibold text-gray-800"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setIsEmailFocused(true)}
            onBlur={() => setIsEmailFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        {/* Phone Number Display */}
        <Text className="mt-8 mb-2 font-semibold text-gray-800">
          Phone Number
        </Text>
        <View className="flex-row items-center p-1 bg-[#F9FAFB] border rounded-2xl border-slate-200">
          <View className="items-center justify-center w-12 h-12 m-1 bg-[#0DB07B] rounded-xl">
            <Ionicons name="call" size={20} color="white" />
          </View>
          <Text className="flex-1 p-3 text-lg font-semibold text-[#4B5563]">
            +91 {phoneNumber}
          </Text>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={isSubmitting}
          className={`mt-6 p-5 rounded-2xl items-center justify-center ${
            isSubmitting ? "bg-gray-400" : "bg-[#1C2533]"
          }`}
          style={{ elevation: 3, shadowColor: "#000" }}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-xl font-bold text-white">Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      <SecureAuthSection />

      {/* Footer Text */}
      <View className="items-center mt-4 mb-8">
        <Text className="text-sm text-center text-gray-500">
          By creating an account, you agree to our{" "}
          <Text className="font-semibold text-gray-700">Terms of Service</Text>
          {"\n"}and{" "}
          <Text className="font-semibold text-gray-700">Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#1C2533]"
    >
      <LinearGradient
        colors={["#172033", "#1C2533"]}
        className="h-[30%] items-center justify-center"
        style={{ minHeight: 200 }}
      >
        {/* <StatusBar barStyle="light-content" backgroundColor="#172033" /> */}
        <Text className="mb-2 text-5xl font-bold text-white mt-14">
          Buildorite
        </Text>
        <Text className="text-lg font-semibold text-gray-200">
          Professional Material Marketplace
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 p-6 bg-white rounded-t-3xl">
          {renderRegisterForm()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;