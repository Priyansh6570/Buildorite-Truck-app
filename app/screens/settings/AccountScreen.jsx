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
  StatusBar,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useUpdateUserProfile } from "../../hooks/useUser";
import auth from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';

import AntDesign from '@expo/vector-icons/AntDesign';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const AccountScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const updateUserMutation = useUpdateUserProfile();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [changesMade, setChangesMade] = useState(false);
  const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
  const [submittedUpdate, setSubmittedUpdate] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (name !== user?.name || email !== user?.email || (phone !== user?.phone && phoneUpdateSuccess)) {
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
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return checkForUnsavedChanges();
      });
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
      ...(phoneUpdateSuccess && { phone })
    };
    updateUserMutation.mutate(updateData);
    navigation.goBack();
  };

  const handlePhoneUpdate = async () => {
    try {
      setIsSendingOtp(true);
      const formattedPhoneNumber = newPhone.startsWith("+91") ? newPhone : `+91${newPhone}`;
      const confirmation = await auth().signInWithPhoneNumber(formattedPhoneNumber);
      setConfirm(confirmation);
      setResendTimer(30);
      setCanResend(false);
      setOtpError("");
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send OTP. Please try again.',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      if (!confirm) return;
      if (otp.length !== 6) return;

      setIsVerifying(true);
      await confirm.confirm(otp);
      
      setIsVerifying(false);
      setConfirm(null);
      setPhone(newPhone);
      setNewPhone('');
      setOtp('');
      setPhoneUpdateSuccess(true);
      
    } catch (err) {
      setOtpError("OTP is Invalid");
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (canResend) {
      try {
        setIsSendingOtp(true);
        const formattedPhoneNumber = newPhone.startsWith("+91") ? newPhone : `+91${newPhone}`;
        const confirmation = await auth().signInWithPhoneNumber(formattedPhoneNumber);
        setConfirm(confirmation);
        setResendTimer(30);
        setCanResend(false);
        setOtpError("");
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to resend OTP. Please try again.',
        });
      } finally {
        setIsSendingOtp(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor={showModal ? "rgba(0,0,0,0.5)" : "#f3f4f6"} barStyle="dark-content" />
      
      <View className="p-4 pb-6 bg-gray-100" style={{ height: "25%" }}>
        <TouchableOpacity onPress={handleBackPress} className="absolute left-0 z-10 p-6">
          <Text className="text-4xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        
        <View className="items-center justify-center p-4">
          <Text className="text-2xl font-bold text-black">Update Account</Text>
        </View>
        
        <View className="px-6 mt-12">
          <Text className="mb-2 text-lg font-semibold text-black">Update Your Details</Text>
          <Text className="text-gray-600">
            You can update any of your personal information below. Update only the fields you want to change.
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 bg-white" style={{ height: "75%" }}>
        <Text className="mb-2 text-lg font-bold text-black">Name</Text>
        <View className="flex-row items-center px-4 py-4 mb-6 bg-white rounded-lg shadow-md">
          <AntDesign name="user" size={20} color="black" className="mr-3" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#A0A0A0"
            className="flex-1 ml-2 text-black"
          />
        </View>

        {/* Email Field */}
        <Text className="mb-2 text-lg font-bold text-black">Email</Text>
        <View className="flex-row items-center px-4 py-4 mb-2 bg-white rounded-lg shadow-md">
          <Fontisto name="email" size={20} color="black" className="mr-3" />
          <TextInput
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
            placeholder="Enter your email"
            placeholderTextColor="#A0A0A0"
            className="flex-1 ml-2 text-black"
            keyboardType="email-address"
          />
        </View>
        
        {emailError && emailTouched && (
          <Text className="mb-4 text-sm text-red-500">{emailError}</Text>
        )}
        {!emailError && (
          <View className="mb-4" />
        )}

        {/* Phone Field */}
        <Text className="mb-2 text-lg font-bold text-black">Phone Number</Text>
        
        {phoneUpdateSuccess ? (
          <>
            <View className="flex-row items-center px-4 py-4 mb-2 bg-white rounded-lg shadow-md opacity-70">
              <Ionicons name="call-outline" size={20} color="black" className="mr-3" />
              <TextInput
                value={phone}
                placeholder="Phone Number"
                placeholderTextColor="#A0A0A0"
                className="flex-1 ml-2 text-black"
                keyboardType="phone-pad"
                editable={false}
              />
            </View>
            <Text className="mb-6 text-sm text-green-600">
              Phone number verified successfully.
            </Text>
          </>
        ) : !confirm ? (
          <>
            <View className="flex-row items-center px-4 py-4 mb-2 bg-white rounded-lg shadow-md">
              <Ionicons name="call-outline" size={20} color="black" className="mr-3" />
              <TextInput
                value={newPhone || phone}
                onChangeText={(text) => {
                  setNewPhone(text);
                  setOtpError("");
                  setPhoneUpdateSuccess(false);
                }}
                placeholder="Enter your phone number"
                placeholderTextColor="#A0A0A0"
                className="flex-1 ml-2 text-black"
                keyboardType="phone-pad"
              />
            </View>
            
            {newPhone && newPhone.length === 10 && (
              <TouchableOpacity
                onPress={handlePhoneUpdate}
                className={`p-3 mb-6 mt-4 bg-slate-200 border w-[95%] rounded-lg mx-auto shadow-md ${
                  isSendingOtp ? "opacity-50" : ""
                }`}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="font-bold text-center text-black">Send OTP</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <View className="flex-row items-center px-4 py-4 mb-4 bg-white rounded-lg shadow-md opacity-70">
              <Ionicons name="call-outline" size={20} color="black" className="mr-3" />
              <TextInput
                value={newPhone || phone}
                placeholder="Phone Number"
                placeholderTextColor="#A0A0A0"
                className="flex-1 ml-2 text-black"
                keyboardType="phone-pad"
                editable={false}
              />
            </View>
            
            <Text className="mb-2 text-lg font-bold text-black">OTP Verification</Text>
            <View className="flex-row items-center px-4 py-3 mb-2 bg-white rounded-lg shadow-md">
              <MaterialIcons name="password" size={20} color="black" className="mr-3" />
              <TextInput
                value={otp}
                onChangeText={(text) => {
                  setOtp(text);
                  setOtpError("");
                }}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#A0A0A0"
                className="flex-1 ml-2 text-black"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            
            {otpError && (
              <Text className="mb-2 text-sm text-red-500">{otpError}</Text>
            )}
            
            <TouchableOpacity
              onPress={handleOtpSubmit}
              className={`p-3 mb-2 bg-slate-200 border w-[95%] rounded-lg mx-auto shadow-md ${
                otp.length === 6 && !isVerifying ? "" : "opacity-50"
              }`}
              disabled={otp.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="font-bold text-center text-black">Verify OTP</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleResendOtp} 
              disabled={!canResend || isSendingOtp}
              className="items-center mb-6"
            >
              <Text className={`text-blue-500 ${canResend && !isSendingOtp ? "font-semibold" : "opacity-70"}`}>
                {isSendingOtp ? (
                  "Sending OTP..."
                ) : canResend ? (
                  "Resend OTP"
                ) : (
                  `Resend OTP in ${resendTimer}s`
                )}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={handleUpdate}
          className={`p-4 mt-4 mb-8 rounded-lg shadow-md ${
            isFormValid() ? "bg-black" : "bg-gray-400"
          }`}
          disabled={!isFormValid() || updateUserMutation.isLoading}
        >
          {updateUserMutation.isLoading ? 
            <ActivityIndicator color="#fff" /> : 
            <Text className="font-bold text-center text-white">Update Details</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-[rgba(0,0,0,0.5)]">
          <View className="w-[90%] p-8 bg-white rounded-xl shadow-lg">
            <Text className="mb-4 text-2xl font-bold text-black">Unsaved Changes</Text>
            <Text className="mb-8 text-lg text-gray-700">You have unsaved changes. Do you want to leave without saving?</Text>
            
            <View className="flex-row justify-between gap-2 space-x-4">
              <TouchableOpacity 
                onPress={() => { 
                  setShowModal(false); 
                  setSubmittedUpdate(true);
                  navigation.goBack(); 
                }} 
                className="w-1/2 p-3 border rounded-lg shadow-md bg-slate-200"
              >
                <Text className="font-bold text-center text-black">Leave</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setShowModal(false)} 
                className="w-1/2 p-4 bg-black rounded-lg shadow-md"
              >
                <Text className="font-bold text-center text-white">Stay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountScreen;