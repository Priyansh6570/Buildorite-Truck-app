import React from "react";
import { View, Text } from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// A general-purpose card for displaying key metrics.
const StatCard = ({ title, value, icon, color, bgColor }) => {
  return (
    <View className="p-4 mx-2 my-2 bg-white border border-slate-100 shadow-sm rounded-2xl w-[45%] h-[120px]">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-base font-semibold text-gray-600">{title}</Text>
          <Text className="my-2 text-3xl font-bold text-gray-900">{value}</Text>
        </View>
        <View style={{ backgroundColor: bgColor, padding: 12, borderRadius: 12 }}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
      </View>
    </View>
  );
};

// A specialized, professional card for displaying the connection status.
const ConnectionCard = ({ truckOwner }) => {
    return (
      <View className="w-[93%] mx-2 my-2 overflow-hidden shadow-sm rounded-2xl">
          <LinearGradient
              colors={['#1F2937', '#111827']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5"
          >
              <View className="flex-row items-center">
                  <View className="p-3 rounded-full bg-white/10">
                       <FontAwesome6 name="link" size={18} color="#34D399" />
                  </View>
                  <View className="flex-1 ml-4">
                      <Text className="text-sm font-semibold text-gray-400">Connected With</Text>
                      <Text className="text-lg font-bold text-white">
                          {truckOwner?.name || 'Your Truck Owner'}
                      </Text>
                  </View>
                   <View className="p-2 px-3 rounded-full bg-green-500/20">
                      <Text className="font-bold text-green-400">Active</Text>
                   </View>
              </View>
          </LinearGradient>
      </View>
    );
  };
  
const StatsSection = ({ truckOwner }) => {
  const statsData = [
    { id: 1, value: 15, title: "Trips Completed", icon: "checkmark-done-circle-outline", color: "#16A34A", bgColor: "#F0FDF4" },
    { id: 2, value: 3, title: "Pending Trips", icon: "time-outline", color: "#D97706", bgColor: "#FFFBEB" },
  ];

  return (
    <View className="w-full mt-[-50px]">
        <View className="flex-row flex-wrap items-center justify-center">
            <ConnectionCard truckOwner={truckOwner} />
            {statsData.map((stat) => (
                <StatCard
                    key={stat.id}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    color={stat.color}
                    bgColor={stat.bgColor}
                />
            ))}
        </View>
    </View>
  );
};

export default StatsSection;
