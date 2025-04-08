import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMineStore } from "../../store/mineStore";
import { useMaterialStore } from "../../store/materialStore";

const statsData = [
  { id: 1, percentage: "+5.2%", title: "Active Mines", icon: "hammer-outline", type: "mine" },
  { id: 2, percentage: "+3.8%", title: "Available Materials", icon: "cube-outline", type: "material" },
  { id: 3, title: "Recent Orders", icon: "receipt-outline", value: 25, trend: "+7.1%" },
  { id: 4, title: "Market Trends", icon: "trending-up-outline", isLink: true },
];

const StatCard = ({ title, value, trend, icon, isLink, percentage }) => {
  return (
    <View className="p-4 mx-2 my-2 bg-white shadow-xl rounded-xl w-[45%] h-[120px]">
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-sm text-gray-500">{title}</Text>
            {isLink && <Text className="my-2 text-2xl font-bold text-black">View</Text>}
          {isLink && <Text className="mt-1 text-sm font-medium text-indigo-600">View Report →</Text>}
          <Text className="my-2 text-2xl font-bold text-gray-900">{value}</Text>
          {trend && !isLink && <Text className="mt-2 text-sm text-green-500">{trend}</Text>}
          <Text className="mt-2 text-sm text-green-500">{percentage}</Text>
        </View>
        <View className="p-2 rounded-lg bg-indigo-50">
          <Ionicons name={icon} size={24} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
};

const StatsSection = () => {
  const mineCount = useMineStore((state) => state.mines.length);
  const materialCount = useMaterialStore((state) => state.materials.length);

  return (
    <View className="w-full">
      <View className='h-[50px] w-full bg-black absolute'></View>
      <View className="flex-row flex-wrap justify-center">
        {statsData.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            percentage={stat.percentage}
            value={stat.type === "mine" ? mineCount : stat.type === "material" ? materialCount : stat.value}
            trend={stat.trend}
            icon={stat.icon}
            isLink={stat.isLink}
          />
        ))}
      </View>
    </View>
  );
};

export default StatsSection;