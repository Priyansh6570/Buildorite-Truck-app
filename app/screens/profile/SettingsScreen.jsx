import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { useLogoutUser } from "../../hooks/useAuth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const logoutUser = useLogoutUser();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = () => {
    logoutUser.mutate(null, {
      onSuccess: () => {
        setModalVisible(false);
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
      },
    });
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This feature is not currently available.",
      [{ text: "OK", style: "cancel" }],
      { cancelable: false }
    );
  };

  return (
    <View className="flex-1">
      {/* Top Section (30% height, light grey) */}
      <View className="h-[20%] bg-gray-100 relative p-8">
        <StatusBar backgroundColor="#f3f4f6" barStyle="dark-content" />
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-8 top-10">
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="absolute mt-4 text-3xl font-bold left-10 top-24">Settings</Text>
      </View>

      {/* Bottom Section (white, scrollable content) */}
      <ScrollView className="flex-1 p-4 bg-white">
        {/* General Settings */}
        <Text className="mt-8 text-xl font-bold">General</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Account")}
          className="flex-row items-center justify-between p-4 mt-4 border-b border-gray-300"
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="account-edit-outline" size={22} color="black" />
            <Text className="ml-3 font-semibold">Account</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex-row items-center justify-between p-4 border-b border-gray-300"
        >
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="logout" size={22} color="black" />
            <Text className="ml-3 font-semibold">Sign out</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="flex-row items-center justify-between p-4 border-b border-gray-300 opacity-50" // Greyed out
          disabled={true} // Disabled
        >
          <View className="flex-row items-center">
            <AntDesign name="warning" size={22} color="gray" />
            <Text className="ml-3 font-semibold text-gray-500">Delete Account (Unavailable)</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color="gray" />
        </TouchableOpacity>

        {/* Feedback Section */}
        <Text className="mt-8 text-xl font-bold">Feedback</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ReportBug")}
          className="flex-row items-center justify-between p-4 mt-4 border-b border-gray-300"
        >
          <View className="flex-row items-center">
            <Ionicons name="bug-outline" size={22} color="black" />
            <Text className="ml-3 font-semibold">Report a Bug</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color="gray" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Feedback")}
          className="flex-row items-center justify-between p-4 border-b border-gray-300"
        >
          <View className="flex-row items-center">
            <FontAwesome name="paper-plane-o" size={22} color="black" />
            <Text className="ml-3 font-semibold">Give Feedback</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={18} color="gray" />
        </TouchableOpacity>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        animationType="fade"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable
          onPress={closeModal}
          className="items-center justify-center flex-1 bg-[00000060] bg-opacity-50"
        >
          <View className="w-4/5 p-6 bg-white rounded-lg">
            <Text className="mb-4 text-lg font-bold text-center">Do you want to Sign Out?</Text>

            <TouchableOpacity
              onPress={handleLogout}
              className="w-full py-3 mt-4 bg-red-500 rounded-lg shadow-lg shadow-red-400"
            >
              <Text className="font-semibold text-center text-white">
                {logoutUser.isLoading ? <ActivityIndicator color="#fff" /> : "Sign Out"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SettingsScreen;