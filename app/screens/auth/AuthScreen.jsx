import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import auth from "@react-native-firebase/auth";
import Toast from "react-native-toast-message";
import { useCheckUser, useLoginUser } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

const AuthScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  
  const { setUser } = useAuthStore();

  const checkUserMutation = useCheckUser();
  const loginMutation = useLoginUser();

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

  const handlePhoneNumberSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formattedPhoneNumber = phoneNumber.startsWith("+91")
        ? phoneNumber
        : `+91${phoneNumber}`;

      const confirmation = await auth().signInWithPhoneNumber(
        formattedPhoneNumber
      );
      setConfirm(confirmation);
      setResendTimer(30);
      setCanResend(false);
      
      checkUserMutation.mutate(phoneNumber, {
        onSuccess: (data) => {
          if (data.userExists) {
            setUserData(data);
          } else {
            setUserData(null);
          }
        },
        onError: () => {
          setUserData(null);
        },
        onSettled: () => {
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      setIsSubmitting(false);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    }
  };

  const handleOtpSubmit = async () => {
    try {
      if (!confirm) return;
      if (otp.length !== 6) return;

      setIsVerifying(true);
      await confirm.confirm(otp);

      if (
        userData?.userExists &&
        (userData.role === "truck_owner" || userData.role === "driver" || userData.role === "admin")
      ) {
        loginMutation.mutate(phoneNumber, {
          onSuccess: (loginData) => {
            setUser(loginData.user, loginData.accessToken);
            if(loginData.user.role === "driver") {
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
            setIsVerifying(false);
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Something went wrong. Please try again.",
            });
          },
          onSettled: () => {
            setIsVerifying(false);
          },
        });
      } else if (userData?.userExists) {
        setIsVerifying(false);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "You are not authorized to use this app.",
        });
      } else {
        setIsVerifying(false);
        navigation.navigate("Register", { phoneNumber });
      }
    } catch (err) {
      setOtpError("OTP is Invalid");
      setIsVerifying(false);
    }
  };

  const handleResendOtp = () => {
    if (canResend) {
      resendOtp();
    }
  };

  const resendOtp = async () => {
    try {
      setIsSubmitting(true);
      const formattedPhoneNumber = phoneNumber.startsWith("+91")
        ? phoneNumber
        : `+91${phoneNumber}`;

      const confirmation = await auth().signInWithPhoneNumber(
        formattedPhoneNumber
      );

      Toast.show({
        type: "success",
        text1: "OTP Resent",
        text2: "OTP sent successfully. Please check your SMS.",
      });
      
      setConfirm(confirmation);
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      setIsSubmitting(false);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <View className="relative h-[30%] items-center justify-center bg-black">
        <Image source={require("../../../assets/Dark.png")} className="w-56 h-56" />
      </View>

      <View className="flex-1 p-6 bg-white rounded-t-3xl">
        {!confirm ? (
          <View className={isSubmitting ? "opacity-50 pointer-events-none" : ""}>
            <Text className="mb-2 text-lg">Enter your mobile number</Text>
            <View className="flex-row items-center w-full p-1 mb-4 bg-gray-100 rounded-lg">
              <Text className="pl-3">+91 </Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Mobile Number"
                className="flex-1 p-3 pl-0"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isSubmitting}
                returnKeyType="done"
                onSubmitEditing={handlePhoneNumberSubmit}
              />
              <Image source={require("../../../assets/login-ico.png")} className="w-6 h-6 p-1 mr-2" />
            </View>

            <TouchableOpacity
              onPress={handlePhoneNumberSubmit}
              disabled={isSubmitting}
              className="items-center w-full p-3 bg-black rounded-lg"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-semibold text-white">Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className={isVerifying ? "opacity-50 pointer-events-none" : ""}>
            {userData?.userExists && (
              <Text className="mb-2 text-2xl font-bold">
                Welcome back, {userData.name || "User"}!
              </Text>
            )}
            <Text className="mb-2 text-sm">
              Enter the 6-digit code sent via SMS at {phoneNumber}
            </Text>
            <TextInput
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                setOtpError("");
              }}
              placeholder="6-digit OTP"
              className="w-full p-3 mt-6 mb-2 tracking-widest text-center border rounded-lg"
              keyboardType="number-pad"
              maxLength={6}
              editable={!isVerifying}
              returnKeyType="done"
              onSubmitEditing={handleOtpSubmit}
            />
            {otpError ? <Text className="mb-2 text-red-500">{otpError}</Text> : null}
            <TouchableOpacity
              onPress={handleOtpSubmit}
              disabled={otp.length !== 6 || isVerifying}
              className="items-center w-full p-3 bg-black rounded-lg"
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base text-white">Verify OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResendOtp} disabled={!canResend}>
              <Text className="mt-2 text-blue-500 underline">
                {canResend ? "Resend OTP" : `Resend OTP in ${resendTimer}s`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default AuthScreen;