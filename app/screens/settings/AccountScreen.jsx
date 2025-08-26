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
import { useAuthStore } from "../../store/authStore";
import { useUpdateUserProfile } from "../../hooks/useUser";
import { useVerifyPhone, useVerifyOtp } from "../../hooks/useAuth";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

import Feather from "@expo/vector-icons/Feather";
import {
  FontAwesome6,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";

const AccountScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const updateUserMutation = useUpdateUserProfile();
  const verifyPhoneMutation = useVerifyPhone();
  const verifyOtpMutation = useVerifyOtp();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [changesMade, setChangesMade] = useState(false);
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
  const [submittedUpdate, setSubmittedUpdate] = useState(false);
  const [phoneVerificationError, setPhoneVerificationError] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatPhoneForDisplay = (phoneNumber) => {
    if (!phoneNumber) return "";
    const cleaned = phoneNumber.replace(/^\+91/, "");
    return cleaned.replace(/(\d{6})(\d{4})/, "******$2");
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0 && otpSent) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer, otpSent]);

  useEffect(() => {
    if (
      name !== user?.name ||
      email !== user?.email ||
      (phone !== user?.phone && phoneUpdateSuccess)
    ) {
      setChangesMade(true);
    } else {
      setChangesMade(false);
    }
  }, [name, email, phone, user, phoneUpdateSuccess]);

  useEffect(() => {
    if (emailTouched && email) {
      if (!validateEmail(email)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  }, [email, emailTouched]);

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

  const isFormValid = () => {
    return !emailError && (email ? validateEmail(email) : true);
  };

  const handleUpdate = () => {
    if (!isFormValid()) {
      if (email && !validateEmail(email)) {
        setEmailTouched(true);
      }
      return;
    }

    setSubmittedUpdate(true);
    const updateData = {
      name,
      email,
      ...(phoneUpdateSuccess && { phone }),
    };
    updateUserMutation.mutate(updateData);
    navigation.goBack();
  };

  const handlePhoneUpdate = async () => {
    if (newPhone.length !== 10) {
      Toast.show({
        type: "error",
        text1: "Invalid Phone Number",
        text2: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsSendingOtp(true);
    setPhoneVerificationError(false);
    setOtpError("");

    try {
      verifyPhoneMutation.mutate(newPhone, {
        onSuccess: () => {
          console.log("OTP sent successfully for phone update");
          Toast.show({ type: "success", text1: "OTP Sent Successfully" });
          setOtpSent(true);
          setResendTimer(30);
          setCanResend(false);
          setIsSendingOtp(false);
        },
        onError: (error) => {
          console.error("Failed to send OTP for phone update:", error);
          Toast.show({ 
            type: "error", 
            text1: "Failed to send OTP", 
            text2: "Please try again." 
          });
          setIsSendingOtp(false);
          setPhoneVerificationError(true);
        },
      });
    } catch (err) {
      console.error("Error in handlePhoneUpdate:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to send OTP. Please try again.",
      });
      setIsSendingOtp(false);
      setPhoneVerificationError(true);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Invalid OTP",
        text2: "Please enter a valid 6-digit OTP.",
      });
      return;
    }

    setIsVerifying(true);
    setPhoneVerificationError(false);
    setOtpError("");

    try {
      verifyOtpMutation.mutate({ phone: newPhone, otp }, {
        onSuccess: (data) => {
          console.log("OTP verified successfully for phone update");
          Toast.show({ type: "success", text1: "Phone Number Updated Successfully" });
          
          // Update phone number and reset OTP states
          setPhone(newPhone);
          setNewPhone("");
          setOtp("");
          setOtpSent(false);
          setPhoneUpdateSuccess(true);
          setIsVerifying(false);
          setResendTimer(30);
          setCanResend(false);
        },
        onError: (err) => {
          console.error("OTP verification error for phone update:", err);
          Toast.show({ 
            type: "error", 
            text1: "Invalid OTP", 
            text2: "The code you entered is incorrect." 
          });
          
          setOtpError("OTP is Invalid");
          setPhoneVerificationError(true);
          setIsVerifying(false);
          setOtp(""); // Clear OTP input on verification failure
        },
      });
    } catch (err) {
      console.error("Error in handleOtpSubmit:", err);
      setOtpError("OTP is Invalid");
      setPhoneVerificationError(true);
      setIsVerifying(false);
      setOtp(""); // Clear OTP input on error
      Toast.show({ 
        type: "error", 
        text1: "Invalid OTP", 
        text2: "The code you entered is incorrect." 
      });
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsSendingOtp(true);
    setPhoneVerificationError(false);
    setOtpError("");

    try {
      verifyPhoneMutation.mutate(newPhone, {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "OTP Resent Successfully" });
          setResendTimer(30);
          setCanResend(false);
          setIsSendingOtp(false);
        },
        onError: (error) => {
          console.error("Failed to resend OTP:", error);
          Toast.show({ 
            type: "error", 
            text1: "Failed to resend OTP", 
            text2: "Please try again." 
          });
          setIsSendingOtp(false);
        },
      });
    } catch (err) {
      console.error("Error in handleResendOtp:", err);
      Toast.show({
        type: "error",
        text1: "Failed to resend OTP",
        text2: "Please try again.",
      });
      setIsSendingOtp(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
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
              Update Account
            </Text>
          </View>

          <View className="px-6">
            <View className="p-8 -mt-6 bg-white shadow-2xl rounded-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-semibold text-gray-700">
                  Account Update
                </Text>
                <Ionicons name="information-circle" size={24} color="#1F2937" />
              </View>
              <Text className="text-sm text-gray-600">
                You can update any of your account details below. Even updating
                a single field will save all your changes.
              </Text>
            </View>

            <View className="p-8 py-10 mt-6 bg-white border shadow-sm rounded-3xl border-slate-100">
              <View className="flex-row items-start mb-6">
                <View className="mr-5 overflow-hidden rounded-2xl">
                  <LinearGradient
                    colors={["#fb923c", "#ea580c"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="p-4"
                  >
                    <FontAwesome6 name="user" solid size={20} color="#ffffff" />
                  </LinearGradient>
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    Account Information
                  </Text>
                  <Text className="text-base text-gray-500">
                    Update your personal details
                  </Text>
                </View>
              </View>

              <Text className="my-2 text-base font-semibold text-gray-700">
                Full Name
              </Text>
              <View className="relative mb-6">
                <TextInput
                  className="w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
                <FontAwesome5
                  name="edit"
                  size={18}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 16, top: 24 }}
                />
              </View>

              <Text className="mb-2 text-base font-semibold text-gray-700">
                Email Address
              </Text>
              <View className="relative mb-2">
                <TextInput
                  className="w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl"
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailTouched) {
                      if (!validateEmail(text) && text) {
                        setEmailError("Please enter a valid email address");
                      } else {
                        setEmailError("");
                      }
                    }
                  }}
                  onBlur={() => {
                    setEmailTouched(true);
                    if (email && !validateEmail(email)) {
                      setEmailError("Please enter a valid email address");
                    } else {
                      setEmailError("");
                    }
                  }}
                  keyboardType="email-address"
                />
                <Ionicons
                  name="mail"
                  size={20}
                  color="#9CA3AF"
                  style={{ position: "absolute", right: 16, top: 24 }}
                />
              </View>
              {emailError && emailTouched && (
                <Text className="mb-6 text-base text-red-500">
                  {emailError}
                </Text>
              )}
              {!emailError && <View className="mb-6" />}

              {/* Mobile Number */}
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Mobile Number
              </Text>

              {phoneUpdateSuccess ? (
                <>
                  <View className="p-4 mb-6 border border-green-200 bg-green-50 rounded-xl">
                    <View className="flex-row items-center">
                      <View className="p-2 mr-3 bg-green-500 rounded-full">
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-900">
                          Mobile Number Updated Successfully!
                        </Text>
                        <Text className="text-sm text-green-600">
                          Your mobile number has been updated to +91 {phone}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              ) : !otpSent ? (
                <>
                  <View className="relative mb-4">
                    <TextInput
                      className="w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl"
                      placeholder="Enter your mobile number"
                      placeholderTextColor="#9CA3AF"
                      value={newPhone || phone}
                      onChangeText={(text) => {
                        setNewPhone(text);
                        setOtpError("");
                        setPhoneUpdateSuccess(false);
                        setPhoneVerificationError(false);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                      editable={!isSendingOtp}
                    />
                    <Ionicons
                      name="call"
                      size={20}
                      color="#9CA3AF"
                      style={{ position: "absolute", right: 16, top: 24 }}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handlePhoneUpdate}
                    className={`h-[56px] justify-center items-center rounded-xl mb-6 ${
                      newPhone && newPhone.length === 10 && !isSendingOtp
                        ? "bg-[#1F2937]"
                        : "bg-gray-400"
                    }`}
                    disabled={
                      !(newPhone && newPhone.length === 10) || isSendingOtp
                    }
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-lg font-semibold text-white">
                        Send OTP
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="p-4 mb-4 border border-blue-200 bg-blue-50 rounded-xl">
                    <View className="flex-row items-center">
                      <View className="p-2 mr-3 bg-blue-500 rounded-full">
                        <Ionicons name="information" size={16} color="white" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-blue-700">
                          OTP Sent Successfully
                        </Text>
                        <Text className="text-sm text-blue-600">
                          We've sent a 6-digit code to +91{" "}
                          {formatPhoneForDisplay(newPhone || phone)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="relative mb-4">
                    <TextInput
                      className="w-full h-[68px] p-4 px-6 pr-14 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl text-center"
                      placeholder="Enter 6-digit OTP"
                      style={{ letterSpacing: 2 }}
                      placeholderTextColor="#9CA3AF"
                      value={otp}
                      onChangeText={(text) => {
                        setOtp(text);
                        setOtpError("");
                        setPhoneVerificationError(false);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!isVerifying}
                      returnKeyType="done"
                      onSubmitEditing={handleOtpSubmit}
                    />
                    <MaterialIcons
                      name="security"
                      size={24}
                      color="#9CA3AF"
                      style={{ position: "absolute", right: 16, top: 22 }}
                    />
                  </View>

                  {phoneVerificationError && (
                    <View className="p-4 mb-4 border border-red-200 bg-red-50 rounded-xl">
                      <View className="flex-row items-center">
                        <View className="p-2 mr-3 bg-red-500 rounded-full">
                          <Ionicons name="close" size={16} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-red-700">
                            Verification Failed
                          </Text>
                          <Text className="text-sm text-red-600">
                            {otpError || "Please check your OTP and try again"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleOtpSubmit}
                    className={`h-[56px] justify-center items-center rounded-xl mb-4 ${
                      otp.length === 6 && !isVerifying
                        ? "bg-[#1F2937]"
                        : "bg-gray-400"
                    }`}
                    disabled={otp.length !== 6 || isVerifying}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-lg font-semibold text-white">
                        Verify OTP
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View className="flex-row items-center justify-center mb-6">
                    <Text className="mr-2 text-sm text-gray-600">
                      Didn't receive code?
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={!canResend || isSendingOtp}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          canResend && !isSendingOtp
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      >
                        {isSendingOtp
                          ? "Sending..."
                          : canResend
                          ? "Resend OTP"
                          : `Resend in ${resendTimer}s`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
          <View className="px-6 py-4 bg-white border-t border-gray-200">
            <TouchableOpacity
              onPress={handleUpdate}
              className={`h-[56px] justify-center items-center rounded-xl mb-2 ${
                isFormValid() ? "bg-[#1F2937]" : "bg-gray-400"
              }`}
              disabled={!isFormValid() || updateUserMutation.isLoading}
            >
              {updateUserMutation.isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-lg font-semibold text-white">
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
            <Text className="text-sm text-center text-gray-500">
              Changes will be saved to your account
            </Text>
          </View>
        </ScrollView>
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
              <View className="p-4 mb-4 bg-orange-100 rounded-full">
                <MaterialIcons name="warning" size={32} color="#ea580c" />
              </View>
              <Text className="mb-2 text-2xl font-bold text-gray-900">
                Unsaved Changes
              </Text>
              <Text className="text-lg text-center text-gray-600">
                You have unsaved changes. Are you sure you want to leave without
                saving?
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

export default AccountScreen;