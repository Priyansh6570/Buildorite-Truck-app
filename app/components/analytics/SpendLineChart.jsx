import React from "react";
import { View, Text } from "react-native";
import { LineChart } from "react-native-gifted-charts";

const SpendLineChart = ({ spendByMonth }) => {
  const processSpendData = () => {
    if (!spendByMonth || Object.keys(spendByMonth).length === 0) return [];

    const entries = Object.entries(spendByMonth).sort(([a], [b]) => new Date(a) - new Date(b));

    let chartData = entries.map(([date, spend]) => ({
      value: spend.total,
      label: new Date(date + "-01").toLocaleDateString("en", { month: "short" }),
      labelTextStyle: { color: "#6B7280", fontSize: 10 },
    }));

    if (chartData.length === 1) {
      chartData = [{ value: 0, label: "", hideDataPoint: true }, { ...chartData[0] }];
    }
    return chartData;
  };

  const getYAxisRange = (data) => {
    if (!data.length) return { max: 10000, step: 2000 };
    const maxValue = Math.max(...data.map((item) => item.value));
    const step = Math.ceil(maxValue / 5 / 1000) * 1000 || 2000;
    return { max: Math.ceil(maxValue / step) * step, step };
  };

  const formatCurrency = (value) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value}`;
  };

  const chartData = processSpendData();
  const yAxisConfig = getYAxisRange(chartData);

  if (!chartData.length) {
    return (
      <View className="p-6 bg-white shadow-sm rounded-2xl">
        <Text className="mb-4 text-lg font-semibold text-gray-800">Spend Trend</Text>
        <View className="items-center justify-center h-48">
          <Text className="text-gray-500">No spending data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="p-6 bg-white shadow-sm rounded-2xl">
      <Text className="mb-4 text-lg font-semibold text-gray-800">Spend Trend</Text>
      <View className="items-center overflow-hidden">
        <LineChart
          data={chartData}
          height={180}
          width={260}
          curved
          areaChart
          isAnimated
          animationDuration={1000}
          color="#2563EB"
          startFillColor="rgba(37, 99, 235, 0.3)"
          endFillColor="rgba(37, 99, 235, 0.05)"
          startOpacity={0.9}
          endOpacity={0.1}
          initialSpacing={30}
          endSpacing={30}
          spacing={chartData.length > 2 ? 300 / (chartData.length - 1) : 200}
          thickness={3}
          rulesType="solid"
          rulesColor="#E5E7EB"
          xAxisColor="#E5E7EB"
          yAxisColor="#E5E7EB"
          yAxisTextStyle={{ color: "#6B7280", fontSize: 11 }}
          maxValue={yAxisConfig.max}
          stepValue={yAxisConfig.step}
          noOfSections={Math.floor(yAxisConfig.max / yAxisConfig.step)}
          yAxisLabelFormatter={(value) => formatCurrency(value)}
          dataPointsColor="#2563EB"
        />
      </View>
    </View>
  );
};

export default SpendLineChart;
