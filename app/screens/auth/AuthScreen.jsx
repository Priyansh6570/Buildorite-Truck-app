import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import auth from "@react-native-firebase/auth";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { useCheckUser, useLoginUser, useVerifyPhone, useVerifyOtp } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

const AuthScreen = ({ navigation }) => {
  // --- STATE MANAGEMENT ---
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [userData, setUserData] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loadingUserData, setLoadingUserData] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { setUser } = useAuthStore();
  const checkUserMutation = useCheckUser();
  const verifyPhoneMutation = useVerifyPhone();
  const verifyOtpMutation = useVerifyOtp();
  const loginMutation = useLoginUser();

  const handlePhoneNumberSubmit = async () => {
    if (phoneNumber.length !== 10) return;
    
    setIsSubmitting(true);
    setIsLoading(true);

    try {
      verifyPhoneMutation.mutate(phoneNumber, {
        onSuccess: () => {
          console.log("OTP sent successfully");
          Toast.show({ type: "success", text1: "OTP Sent Successfully" });
          
          setLoadingUserData(true);
          checkUserMutation.mutate(phoneNumber, {
            onSuccess: (data) => {
              setUserData(data);
              setConfirm(true);
              setIsSubmitting(false);
              setIsLoading(false);
              setLoadingUserData(false);
            },
            onError: () => {
              setUserData(null);
              setConfirm(true);
              setIsSubmitting(false);
              setIsLoading(false);
              setLoadingUserData(false);
            },
          });
        },
        onError: (error) => {
          console.error("Failed to send OTP:", error);
          Toast.show({ type: "error", text1: "Failed to send OTP. Please try again." });
          
          // Reset states and clear phone number on OTP send failure
          setConfirm(false);
          setIsLoading(false);
          setIsSubmitting(false);
          setLoadingUserData(false);
          setPhoneNumber(""); // Clear phone input on error
          setOtp("");
          setUserData(null);
        },
      });
      
    } catch (err) {
      console.error("Error in handlePhoneNumberSubmit:", err);
      setIsLoading(false);
      setIsSubmitting(false);
      setLoadingUserData(false);
      Toast.show({ type: "error", text1: "Failed to send OTP." });
      setPhoneNumber(""); // Clear phone input on error
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6 || !confirm) return;
    setIsVerifying(true);

    try {
      verifyOtpMutation.mutate({ phone: phoneNumber, otp }, {
        onSuccess: (data) => {
          console.log("OTP verified successfully");
          Toast.show({ type: "success", text1: "OTP Verified Successfully" });
          
          // Only proceed with navigation/login after successful OTP verification
          if (userData?.userExists && (userData.role === "truck_owner" || userData.role === "driver" || userData.role === "admin") && userData.email !== null && userData.email !== undefined) {
            console.log(userData.email, userData);
            
            loginMutation.mutate(phoneNumber, {
              onSuccess: (loginData) => {
                setUser({ ...loginData.user, email: userData.email }, loginData.accessToken);
                if (loginData.user.role === "driver") {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "DBNav" }],
                  });
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "Main" }],
                  });
                }
              },
              onError: () => {
                Toast.show({ type: "error", text1: "Login failed." });
                setIsVerifying(false);
              },
            });
          } else if (userData?.userExists && userData.role === "mine_owner") {
            console.log(userData);
            Toast.show({ type: "error", text1: "Authorization Failed", text2: "You are not authorized to use this app." });
            setIsVerifying(false);
          } else {
            // New user - go to registration
            navigation.reset({ index: 0, routes: [{ name: "Register", params: { phoneNumber, role: userData?.role } }] });
          }
        },
        onError: (err) => {
          console.error("OTP verification error:", err);
          Toast.show({ type: "error", text1: "Invalid OTP", text2: "The code you entered is incorrect." });
          
          // Stay on OTP screen, clear OTP, don't set user data
          setIsVerifying(false);
          setOtp(""); // Clear OTP input on verification failure
          // Don't clear userData or setConfirm(false) - stay on OTP screen
        },
      });
      
    } catch (err) {
      console.error("Error in handleOtpSubmit:", err);
      Toast.show({ type: "error", text1: "Invalid OTP", text2: "The code you entered is incorrect." });
      setIsVerifying(false);
      setOtp(""); // Clear OTP input on error
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      // Use your Twilio resend instead of Firebase
      verifyPhoneMutation.mutate(phoneNumber, {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "OTP Resent Successfully" });
          setIsResending(false);
        },
        onError: (error) => {
          console.error("Failed to resend OTP:", error);
          Toast.show({ type: "error", text1: "Failed to resend OTP" });
          setIsResending(false);
        },
      });
    } catch (err) {
      console.error("Error in handleResendOtp:", err);
      Toast.show({ type: "error", text1: "Failed to resend OTP" });
      setIsResending(false);
    }
  };

  // --- UI COMPONENTS ---
  const SecureAuthSection = () => (
    <View className="my-6 overflow-hidden border-2 shadow-sm rounded-2xl border-slate-100">
      <LinearGradient colors={["#F0FDF4", "#f0f9ff"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="flex-row items-center p-6">
        <View className="mr-4 overflow-hidden shadow-sm rounded-xl">
          <LinearGradient colors={["#21C25C", "#17A54B"]} className="items-center justify-center w-16 h-16">
            <FontAwesome5 name="lock" size={20} color="white" />
          </LinearGradient>
        </View>
        <View>
          <Text className="text-xl font-bold text-gray-900">Secure Authentication</Text>
          <Text className="text-gray-600 text-md">End-to-end encrypted protection</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderPhoneInputView = () => (
    <View>
      <View className="p-10 bg-white border rounded-3xl border-slate-100" style={{ elevation: 5, shadowColor: '#00000050' }}>
        
        <Text className="mb-4 text-3xl font-bold text-center text-gray-800">Sign in to continue</Text>
        <Text className="mb-8 text-lg font-semibold text-center text-slate-500">Enter your mobile number to get started</Text>

        <Text className="mb-2 font-semibold text-gray-800">Mobile Number</Text>
        <View className={`flex-row p-3 items-center bg-white border rounded-2xl ${isFocused ? 'border-blue-500 border-2' : 'border-slate-200'}`}>
          <Text className="px-3 text-xl font-semibold text-black">+91</Text>
          <Text className="text-4xl font-extralight text-slate-200">|</Text>
          <TextInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter mobile number"
            placeholderTextColor="#9CA3AF"
            className="flex-1 p-3 text-xl font-semibold text-gray-800"
            keyboardType="phone-pad"
            maxLength={10}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="done"
            onSubmitEditing={handlePhoneNumberSubmit}
            editable={!isLoading} // Disable input while loading
          />
        </View>

        <TouchableOpacity
          onPress={handlePhoneNumberSubmit}
          disabled={phoneNumber.length !== 10 || isLoading || isSubmitting}
          className={`mt-6 p-5 rounded-2xl items-center justify-center ${phoneNumber.length !== 10 || isLoading || isSubmitting ? 'bg-gray-400' : 'bg-[#1C2533]'}`}
          style={{ elevation: 3, shadowColor: '#000' }}
        >
          {isLoading || isSubmitting ? <ActivityIndicator color="#fff" /> : <Text className="text-xl font-bold text-white">Continue</Text>}
        </TouchableOpacity>
      </View>
      <SecureAuthSection />
    </View>
  );

  const renderOtpInputView = () => (
    <View>
      <View className="p-10 mt-6 bg-white border rounded-3xl border-slate-100" style={{ elevation: 5, shadowColor: '#00000050' }}>
        <View className="flex-row items-center justify-center">
        <View className="items-center mb-6 overflow-hidden bg-black rounded-2xl">
          <LinearGradient colors={["#21C25C", "#17A54B"]} className="items-center justify-center w-20 h-20">
            <FontAwesome5 name="shield-alt" size={28} color="white" />
          </LinearGradient>
        </View>
        </View>

        {userData?.userExists && (
          <Text className="mb-6 text-2xl font-bold text-center text-gray-800">Welcome back, {userData.name || "User"}!</Text>
        )}

        <Text className="mb-1 text-lg font-semibold text-center text-slate-500">Enter the 6-digit code sent to</Text>
        <Text className="mb-10 text-lg font-bold text-center text-black">+91 {phoneNumber}</Text>

        <Text className="mb-2 font-semibold text-gray-800">Verification Code</Text>
        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          className="p-5 text-2xl font-bold text-center border rounded-2xl border-slate-200"
          style={{ letterSpacing: 8 }}
          keyboardType="number-pad"
          maxLength={6}
          returnKeyType="done"
          onSubmitEditing={handleOtpSubmit}
          editable={!isVerifying} // Disable input while verifying
        />

        <TouchableOpacity
          onPress={handleOtpSubmit}
          disabled={otp.length !== 6 || isVerifying}
          className={`mt-6 p-5 rounded-2xl items-center justify-center ${otp.length !== 6 || isVerifying ? 'bg-gray-400' : 'bg-[#1C2533]'}`}
          style={{ elevation: 3, shadowColor: '#000' }}
        >
          {isVerifying ? <ActivityIndicator color="#fff" className="p-1" /> : <Text className="text-xl font-bold text-white">Verify OTP</Text>}
        </TouchableOpacity>

        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-gray-600">Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResendOtp} disabled={isResending}>
            {isResending ? <ActivityIndicator size="small" color="#1C2533" className="ml-2" /> : <Text className="font-bold text-gray-800">Resend OTP</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <SecureAuthSection />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#1C2533]">
      <LinearGradient colors={['#172033', '#1C2533']} className="h-[30%] items-center justify-center" style={{ minHeight: 200 }}>
        {/* <StatusBar barStyle="light-content" backgroundColor="#172033" /> */}
        <Text className="mb-2 text-5xl font-bold text-white mt-14">Buildorite</Text>
        <Text className="text-lg font-semibold text-gray-200">Professional Material Marketplace</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 p-6 bg-white rounded-t-3xl">
          {!confirm ? (
            renderPhoneInputView()
          ) : loadingUserData ? (
            <View className="items-center justify-center flex-1">
              <ActivityIndicator size="large" color="#1C2533" />
              <Text className="mt-4 text-lg font-semibold text-gray-600">Verifying your number...</Text>
            </View>
          ) : (
            renderOtpInputView()
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;