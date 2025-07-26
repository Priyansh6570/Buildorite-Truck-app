import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRegisterDriver } from "../../hooks/useAuth";
import Toast from "react-native-toast-message";
import { Feather, FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const CreateDriverScreen = () => {
  // --- STATE & HOOKS ---
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSummitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { mutate: registerDriver, isLoading } = useRegisterDriver();

  // --- FORM VALIDATION ---
  useEffect(() => {
    const isValid = name.trim().length > 2 && phone.trim().length === 10;
    setIsFormValid(isValid);
  }, [name, phone]);

  // --- ACTIONS ---
  const handleRegister = () => {
    if (!isFormValid || isLoading) return;
    setIsSubmitting(true);

    registerDriver(
      { phone, name },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: "Invite Sent!",
            text2: `${name} has been invited to join.`,
          });
          navigation.goBack();
        },
        onError: (error) => {
          Toast.show({
            type: "error",
            text1: "Invitation Failed",
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

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View
        className="flex-row items-center justify-center px-8 py-16 bg-gray-900"
        style={{ paddingTop: insets.top + 40 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-8 top-12 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="-mt-4 text-3xl font-black text-white">
          Add New Driver
        </Text>
      </View>

      <View className="flex-1 px-8 bg-white">
        {/* Informational Section */}
        <View className="p-8 mb-6 -mt-8 bg-white shadow-2xl rounded-2xl">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-bold text-gray-800">
              Invite a New Driver
            </Text>
            <Feather name="send" size={24} color="#1F2937" />
          </View>
          <Text className="text-base text-gray-600">
            An SMS invite will be sent to the driver's phone number to complete
            their registration.
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 rounded-3xl"
            contentContainerStyle={{ paddingBottom: 150 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex gap-6 py-4 space-y-4">
              {/* Driver Details Form */}
              <View className="p-8 py-10 bg-white border shadow-sm rounded-3xl border-slate-100">
                <View className="flex-row items-start mb-10">
                  <View className="mr-5 overflow-hidden rounded-2xl">
                    <LinearGradient
                      colors={["#3B82F6", "#1D4ED8"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="p-4"
                    >
                      <Feather name={"user-plus"} size={20} color="#ffffff" />
                    </LinearGradient>
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-gray-900">
                      Driver Details
                    </Text>
                    <Text className="text-base text-gray-500">
                      Enter the driver's name and phone.
                    </Text>
                  </View>
                </View>
                {/* Driver Name Input */}
                <Text className="mb-2 text-base font-semibold text-gray-600">
                  Name
                </Text>
                <View
                  className={`flex-row p-3 items-center max-h-20 bg-white border rounded-2xl ${
                    isNameFocused
                      ? "border-blue-500 border-2"
                      : "border-slate-200"
                  }`}
                >
                  <FontAwesome6
                    name="user"
                    size={18}
                    color="#9CA3AF"
                    className="ml-4 mr-2"
                  />
                  <TextInput
                    className="flex-1 p-2 pt-3 text-xl font-semibold text-gray-800"
                    placeholder="Enter full name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    returnKeyType="next"
                  />
                </View>
                {/* Phone Number Input */}
                <Text className="mt-8 mb-2 text-base font-semibold text-gray-600">
                  Mobile Number
                </Text>
                <View
                  className={`flex-row p-3 items-center max-h-20 bg-white border rounded-2xl ${
                    isPhoneFocused
                      ? "border-blue-500 border-2"
                      : "border-slate-200"
                  }`}
                >
                  <Text className="px-3 text-xl font-semibold text-black">
                    +91
                  </Text>
                  <Text className="text-4xl font-extralight text-slate-200">
                    |
                  </Text>
                  <TextInput
                    className="flex-1 p-2 pt-3 text-xl font-semibold text-gray-800"
                    placeholder="00000 00000"
                    placeholderTextColor="#9CA3AF"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                </View>
                <View
                  className="pt-4 mt-10"
                  style={{ paddingBottom: insets.bottom || 6 }}
                >
                  <TouchableOpacity
                    className={`w-full py-5 rounded-2xl ${
                      isFormValid && !isLoading ? "bg-gray-800" : "bg-gray-300"
                    }`}
                    onPress={handleRegister}
                    disabled={!isFormValid || isLoading}
                    activeOpacity={0.8}
                  >
                    {isSummitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-xl font-bold text-center text-white">
                        Send Invite
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default CreateDriverScreen;
