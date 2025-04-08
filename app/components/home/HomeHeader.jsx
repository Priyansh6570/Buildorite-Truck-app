import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const HomeHeader = ({ user }) => {
  const navigation = useNavigation();

  return (
    <View className="p-5 px-12 pt-8 bg-black shadow-md">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-white">BuildoRite</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-circle-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>
      <View className="mt-12">
  <Text className="text-4xl font-bold text-white">
    Find and Order {'\n'}Mine Materials Easily
  </Text>
  <Text className="mt-2 text-lg text-gray-300">
    Explore available materials from various mines, {user}! Start your order now.
  </Text>
</View>
    </View>
  );
};

export default HomeHeader;
