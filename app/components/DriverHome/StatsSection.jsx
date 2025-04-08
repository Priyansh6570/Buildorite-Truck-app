import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const StatCard = ({ title, value, trend, icon, isLink, percentage, onPress }) => {
  return (
    <View className="p-4 mx-2 my-2 bg-white shadow-xl rounded-xl w-[45%] h-[120px]">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm text-gray-500">{title}</Text>
          {isLink ? (
            <>
              <Text className="my-2 text-2xl font-bold text-black">Connect</Text>
              <Text className="mt-1 text-sm font-medium text-indigo-600">Connect Now →</Text>
            </>
          ) : (
            <>
              <Text className="my-2 text-2xl font-bold text-gray-900">{value}</Text>
              {trend && <Text className="mt-2 text-sm text-green-500">{trend}</Text>}
              {percentage && <Text className="mt-2 text-sm text-green-500">{percentage}</Text>}
            </>
          )}
        </View>
        <View className="p-2 rounded-lg bg-indigo-50">
          <Ionicons name={icon} size={24} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
};

const ConnectionCard = ({ truckOwner }) => {
  const navigation = useNavigation();
  
  const handlePress = () => {
    navigation.navigate("Connection");
  };
  
  return (
    <TouchableOpacity 
      onPress={handlePress}
      className={`p-4 mx-2 my-2 bg-white shadow-xl rounded-xl w-[93%] h-[120px] ${truckOwner ? 'border-2 border-green-100' : ''}`}
    >
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm text-gray-500">Connection</Text>
          {truckOwner ? (
            <>
              <Text className="my-2 text-xl font-bold text-gray-900">Connected</Text>
              <Text className="mt-1 text-sm text-green-600">
                {truckOwner.name}
              </Text>
            </>
          ) : (
            <>
              <Text className="my-2 text-xl font-bold text-black">Not Connected</Text>
              <Text className="mt-1 text-sm font-medium text-indigo-600">Connect Now →</Text>
            </>
          )}
        </View>
        <View className="p-2 rounded-lg bg-indigo-50">
          <Ionicons name={truckOwner ? "checkmark-circle" : "person-add-outline"} size={24} color={truckOwner ? "#10B981" : "#4F46E5"} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatsSection = ({ truckOwner }) => {
  // Dummy data - will be replaced with real data later
  const statsData = [
    { id: 1, value: 15, title: "Trips Completed", icon: "checkmark-circle-outline" },
    { id: 2, value: 3, title: "Pending Trips", icon: "time-outline" },
  ];

  return (
    <View className="w-full">
      <View className='h-[50px] w-full bg-black absolute'></View>
      <View className="flex-row flex-wrap justify-center">
        {statsData.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
        <ConnectionCard truckOwner={truckOwner} />
      </View>
    </View>
  );
};

export default StatsSection;