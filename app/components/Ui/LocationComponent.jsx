import React from "react";
import { View, Text } from "react-native";
import GetDirectionsButton from "../utils/GetDirectionsButton";

const LocationComponent = ({ mine }) => {
  return (
    <View className="bg-white border border-gray-100 shadow-sm rounded-xl">
      <View className="p-5">
        <View className="flex-row items-start">
          <View className="flex-1">
            <Text className="mb-4 text-xl font-bold tracking-wider text-black">Location & Distance</Text>
            <Text className="font-medium text-gray-700 text-md">{mine?.location?.address || "Address not available"}</Text>
          </View>
        </View>
      </View>
      <View className="p-4 pt-0">
        <GetDirectionsButton mineData={mine} />
      </View>
    </View>
  );
};

export default LocationComponent;
