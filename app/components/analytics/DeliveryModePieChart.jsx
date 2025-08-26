import React from "react";
import { View, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";

const DeliveryModePieChart = ({ deliveryMethodBreakdown }) => {
  const processPieData = () => {
    if (!deliveryMethodBreakdown) return [];

    const pickup = deliveryMethodBreakdown.pickup || 0;
    const delivery = deliveryMethodBreakdown.delivery || 0;
    
    if (pickup === 0 && delivery === 0) return [];

    const total = pickup + delivery;
    
    return [
      { value: pickup, color: '#F59E0B', text: `${Math.round((pickup / total) * 100)}%`, label: 'Pickup' },
      { value: delivery, color: '#8B5CF6', text: `${Math.round((delivery / total) * 100)}%`, label: 'Delivery' }
    ].filter(item => item.value > 0);
  };

  const pieData = processPieData();

  if (!pieData.length) {
    return (
      <View className="p-6 bg-white shadow-sm rounded-2xl">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Delivery Methods</Text>
        <View className="items-center justify-center h-48"><Text className="text-gray-500">No delivery data available</Text></View>
      </View>
    );
  }

  return (
    <View className="p-6 bg-white shadow-sm rounded-2xl">
      <Text className="mb-4 text-lg font-semibold text-gray-800">Delivery Methods</Text>
      
      <View className="flex-row justify-center gap-6 mb-4">
        {pieData.map((item, index) => (
          <View key={index} className="flex-row items-center">
            <View className="w-4 h-4 mr-2 rounded-full" style={{ backgroundColor: item.color }} />
            <Text className="text-sm text-gray-600">{item.label}</Text>
          </View>
        ))}
      </View>

      <View className="items-center">
        <PieChart
          data={pieData}
          donut
          innerRadius={50}
          radius={120}
          isAnimated
          animationDuration={1000}
          showText
          textColor="#1F2937"
          textSize={14}
          showTextBackground
          textBackgroundColor="#FFFFFF"
          textBackgroundRadius={25}
          strokeColor="white"
          strokeWidth={6}
          innerCircleColor="white"
          centerLabelStyle={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}
          centerLabelText="Orders"
          centerLabelComponent={() => (
            <View className="items-center justify-center">
              <Text className="text-2xl font-bold text-gray-800">
                {pieData.reduce((sum, item) => sum + item.value, 0)}
              </Text>
              <Text className="text-sm text-gray-500">Orders</Text>
            </View>
          )}
        />
      </View>
      <View className="flex-row justify-around mt-4">
        {pieData.map((item, index) => (
          <View key={index} className="items-center">
            <Text className="text-lg font-bold text-gray-800">{item.value}</Text>
            <Text className="text-sm text-gray-500 capitalize">{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default DeliveryModePieChart;