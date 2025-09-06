import React from "react";
import { View, Text } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const OrdersBarChart = ({ ordersByMonth }) => {
  const processOrdersData = () => {
    if (!ordersByMonth) return [];

    const entries = Object.entries(ordersByMonth);

    entries.sort(([a], [b]) => new Date(a) - new Date(b));

    const chartData = entries.map(([date, orders]) => ({
      value: orders,
      label: new Date(date).toLocaleDateString("en", { month: "short" }),
      frontColor: "#10B981",
    }));

    return chartData;
  };

  const getYAxisRange = (data) => {
    if (!data.length) return { max: 10, step: 2 };

    const values = data.map((item) => item.value);
    const maxValue = Math.max(...values);

    const step = Math.ceil((maxValue + 1) / 5);
    const adjustedMax = Math.ceil(maxValue / step) * step;

    return {
      max: adjustedMax,
      step: step,
      sections: Math.floor(adjustedMax / step),
    };
  };

  const chartData = processOrdersData();
  const yAxisConfig = getYAxisRange(chartData);

  if (!chartData.length) {
    return (
      <View className="p-6 m-4 bg-white shadow-lg rounded-2xl">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Orders Overview</Text>
        <View className="items-center justify-center h-48">
          <Text className="text-gray-500">No orders data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="p-6 bg-white shadow-sm rounded-2xl">
      <Text className="mb-4 text-lg font-semibold text-gray-800">Orders Overview</Text>

      <View className="items-center overflow-hidden">
        <BarChart
          data={chartData}
          height={200}
          width={280}
          isAnimated
          animationDuration={800}
          barWidth={chartData.length === 1 ? 80 : Math.min(80, 200 / chartData.length)}
          spacing={chartData.length === 1 ? 40 : Math.max(20, 160 / chartData.length)}
          initialSpacing={20}
          endSpacing={20}
          rulesType="solid"
          rulesColor="#E5E7EB"
          showVerticalLines
          verticalLinesColor="#E5E7EB"
          xAxisColor="#E5E7EB"
          yAxisColor="#E5E7EB"
          yAxisTextStyle={{
            color: "#6B7280",
            fontSize: 10,
          }}
          xAxisLabelTextStyle={{
            color: "#6B7280",
            fontSize: 10,
          }}
          maxValue={yAxisConfig.max}
          stepValue={yAxisConfig.step}
          noOfSections={yAxisConfig.sections}
          borderRadius={6}
          gradientColor="rgba(16, 185, 129, 0.3)"
          frontColor="#10B981"
          showValuesAsTopLabel
          topLabelTextStyle={{
            color: "#1F2937",
            fontSize: 12,
            fontWeight: "600",
          }}
          roundedBottom={false}
        />
      </View>
    </View>
  );
};

export default OrdersBarChart;
