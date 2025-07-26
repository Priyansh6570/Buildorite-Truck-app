import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from "expo-status-bar";

const HomeHeader = ({ user }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View className="shadow-md">
      <LinearGradient
        colors={["#0F172A", "#1D283A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="p-5 rounded-2xl"
      >
        <View className="flex-row items-center justify-between px-2 mb-8" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center">
            
            <Text className="text-2xl font-bold text-white">BuildoRite</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            className="p-2 rounded-full bg-white/10"
          >
            <Ionicons name="person-circle-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <View className="px-2 mt-4 mb-8">
          <Text className="text-3xl font-bold leading-tight text-white">
            Discover & Order Mine {'\n'}Materials with Ease
          </Text>
          <Text className="mt-4 text-lg font-medium text-gray-300">
           Welcome back {user}! Your perfect mining solution for all your needs.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default HomeHeader;
