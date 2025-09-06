import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useLogoutUser } from "../../hooks/useAuth";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons, MaterialIcons, Ionicons, FontAwesome, AntDesign, FontAwesome6 } from "@expo/vector-icons";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const logoutUser = useLogoutUser();
  const signOutBottomSheetRef = useRef(null);

  const handleLogout = () => {
    logoutUser.mutate(null, {
      onSuccess: () => {
        signOutBottomSheetRef.current?.close();
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
      },
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSignOutPress = () => {
    signOutBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSignOutCancel = () => {
    signOutBottomSheetRef.current?.close();
  };

  const handleSignOutBottomSheetChange = (index) => {};

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This feature is not currently available.", [{ text: "OK", style: "cancel" }], { cancelable: false });
  };

  const renderSettingsItem = (icon, iconLibrary, title, onPress, disabled = false, isDestructive = false) => {
    const IconComponent = iconLibrary;
    const textColor = disabled ? "text-gray-400" : isDestructive ? "text-red-600" : "text-gray-700";
    const iconColor = disabled ? "#9CA3AF" : isDestructive ? "#DC2626" : "#374151";

    return (
      <TouchableOpacity onPress={onPress} disabled={disabled} className={`flex-row items-center justify-between p-5 border-b border-gray-100 ${disabled ? "opacity-50" : ""}`} activeOpacity={0.7}>
        <View className="flex-row items-center flex-1">
          <View className="mr-4">
            <IconComponent name={icon} size={22} color={iconColor} />
          </View>
          <Text className={`text-base font-medium ${textColor}`}>{title}</Text>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  const renderSectionCard = (title, iconName, iconColors, children) => (
    <View className="p-8 py-10 mt-6 bg-white border shadow-sm rounded-3xl border-slate-100">
      <View className="flex-row items-start mb-6">
        <View className="mr-5 overflow-hidden rounded-2xl">
          <LinearGradient colors={iconColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-4">
            <Feather name={iconName} size={20} color="#ffffff" />
          </LinearGradient>
        </View>
        <View className="flex-1">
          <Text className="text-2xl font-bold text-gray-900">{title}</Text>
          <Text className="text-base text-gray-500">Manage your preferences</Text>
        </View>
      </View>
      <View className="overflow-hidden bg-gray-50 rounded-2xl">{children}</View>
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1">
        <ScrollView className="flex-1 bg-white">
          <View className="flex-row items-center justify-center px-8 py-16 bg-gray-900">
            <TouchableOpacity onPress={handleBackPress} className="absolute left-8 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
              <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <Text className="ml-4 text-3xl font-black text-center text-white">Settings</Text>
          </View>

          <View className="px-6">
            <View className="p-8 -mt-6 bg-white shadow-2xl rounded-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xl font-semibold text-gray-700">App Settings</Text>
                <Ionicons name="settings" size={24} color="#1F2937" />
              </View>
              <Text className="text-sm text-gray-600">Customize your app experience and manage your account preferences.</Text>
            </View>

            {renderSectionCard(
              "General",
              "settings",
              ["#3B82F6", "#1D4ED8"],
              <>
                {renderSettingsItem("account-edit-outline", MaterialCommunityIcons, "Account", () => navigation.navigate("Account"))}
                {user.role === "driver" && renderSettingsItem("truck", Feather, "Vehicle", () => navigation.navigate("Vehicle"))}
                {renderSettingsItem("shield-outline", Ionicons, "Privacy & Security", () => console.log("Privacy settings"))}
                {renderSettingsItem("bell", FontAwesome6, "Notifications", () => console.log("Notification settings"))}
                {renderSettingsItem("globe-outline", Ionicons, "Language & Region", () => console.log("Language settings"))}
              </>
            )}

            {renderSectionCard(
              "Support & Feedback",
              "help-circle",
              ["#10B981", "#059669"],
              <>
                {renderSettingsItem("bug-outline", Ionicons, "Report a Bug", () => navigation.navigate("ReportBug"))}
                {renderSettingsItem("paper-plane-o", FontAwesome, "Give Feedback", () => navigation.navigate("Feedback"))}
                {renderSettingsItem("help-circle-outline", MaterialCommunityIcons, "Help Center", () => console.log("Help center"))}
                {renderSettingsItem("information-circle-outline", Ionicons, "About", () => console.log("About app"))}
              </>
            )}

            {renderSectionCard(
              "Account Actions",
              "user-x",
              ["#EF4444", "#DC2626"],
              <>
                {renderSettingsItem("logout", MaterialCommunityIcons, "Sign Out", handleSignOutPress, false, true)}
                {renderSettingsItem("warning", AntDesign, "Delete Account (Unavailable)", handleDeleteAccount, true, true)}
              </>
            )}

            <View className="items-center py-8 mt-8">
              <Text className="text-sm text-gray-400">Version 1.0.0</Text>
              <Text className="mt-1 text-xs text-gray-400">© 2025 Buildorite</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <ReusableBottomSheet ref={signOutBottomSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }} onChange={handleSignOutBottomSheetChange} enableOverDrag={false} android_keyboardInputMode="adjustResize">
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-red-100 rounded-full">
              <FontAwesome name="sign-out" size={28} color="#EF4444" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Sign Out</Text>
            <Text className="text-center text-gray-600 text-md">Are you sure you want to sign out of your account?</Text>
            <Text className="mt-2 text-sm text-center text-gray-500">You'll need to sign in again to access your account.</Text>
          </View>

          <View className="gap-4 mt-auto">
            <TouchableOpacity onPress={handleLogout} disabled={logoutUser.isLoading} className="flex-row items-center justify-center p-4 bg-red-500 rounded-2xl">
              {logoutUser.isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <FontAwesome name="sign-out" size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">Sign Out</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignOutCancel} className="p-4 bg-gray-100 rounded-2xl" disabled={logoutUser.isLoading}>
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

export default SettingsScreen;
