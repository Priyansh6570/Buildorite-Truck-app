import React from "react";
import { View, Text, StatusBar } from "react-native";
import useNetworkStatus from "../../hooks/useNetworkStatus";

const NoInternetWarning = () => {
  const isConnected = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View className="absolute top-0 left-0 right-0 z-50 flex justify-end p-3 bg-red-600 h-28">
        {/* <StatusBar backgroundColor="#dc2626" barStyle="light-content" /> */}
      <Text className="font-bold text-center text-white">No Internet Connection</Text>
    </View>
  );
};

export default NoInternetWarning;