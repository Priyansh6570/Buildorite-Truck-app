import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const StatusBadge = ({ status }) => {
  let statusColor = "bg-gray-200 text-gray-800";
  let statusText = "Unknown";

  if (status === "idle") {
    statusColor = "bg-blue-100 text-blue-800";
    statusText = "Idle";
  } else if (status === "on_trip") {
    statusColor = "bg-green-100 text-green-800";
    statusText = "On Trip";
  } else if (status === "unavailable") {
    statusColor = "bg-red-100 text-red-800";
    statusText = "Unavailable";
  }

  return (
    <View className={`px-3 py-1 rounded-full ${statusColor.split(" ")[0]}`}>
      <Text className={`text-xs font-medium ${statusColor.split(" ")[1]}`}>{statusText}</Text>
    </View>
  );
};

// Function to format registration number with spaces
const formatRegNumber = (regNumber) => {
  if (!regNumber) return "";

  // Handle common Indian registration formats like "AB12CD1234" or "23BH1234AA"
  if (regNumber.length === 10) {
    // Format like "AB 12 CD 1234"
    return `${regNumber.slice(0, 2)} ${regNumber.slice(2, 4)} ${regNumber.slice(4, 6)} ${regNumber.slice(6)}`;
  } else if (regNumber.length === 9) {
    // Format like "23 BH 1234 AA"
    return `${regNumber.slice(0, 2)} ${regNumber.slice(2, 4)} ${regNumber.slice(4, 8)} ${regNumber.slice(8)}`;
  }

  let formatted = "";
  for (let i = 0; i < regNumber.length; i++) {
    formatted += regNumber[i];
    if ((i + 1) % 2 === 0 && i !== regNumber.length - 1) {
      formatted += " ";
    }
  }
  return formatted;
};

const TruckDetailCard = ({ truck }) => {
  const navigation = useNavigation();

  if (!truck) {
    return (
      <View className="m-4">
        <Text className="px-2 mb-2 text-xl font-bold text-gray-800">Truck Details</Text>
        <View className="items-center p-6 bg-white shadow-lg rounded-xl">
          <Text className="text-lg text-gray-500">No truck information available</Text>
          <TouchableOpacity onPress={() => navigation.navigate("AddTruck")} className="px-6 py-3 mt-4 bg-black rounded-lg">
            <Text className="font-semibold text-white">Add Truck Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="m-4">
      <Text className="px-2 mb-2 text-xl font-bold text-gray-800">Truck Details</Text>
      <View className="p-6 bg-white shadow-lg rounded-xl">
        <View className="flex-row justify-end mb-2">
          <StatusBadge status={truck.status} />
        </View>

        <View className="items-center mb-4">
          <Image source={require("../../../assets/icons/truckHomeCard.png")} className="w-[130px] h-[130px]" resizeMode="contain" />
        </View>

        <View className="items-center mb-4">
          <Text className="text-2xl font-bold text-gray-800">{truck.name}</Text>
        </View>

        <Text className="mb-2 text-sm text-gray-500">Registration Number</Text>

        <View className="p-3 mb-4 bg-gray-200 rounded-lg">
          <Text className="text-lg font-bold tracking-widest text-center" style={{ fontFamily: "monospace" }}>
            {formatRegNumber(truck.registration_number)}
          </Text>
        </View>

        {truck.assigned_trip_id ? (
          <TouchableOpacity
            className="flex-row items-center justify-center w-full px-4 py-4 mt-2 bg-indigo-600 rounded-lg"
            onPress={() =>
              navigation.navigate("TripDetails", {
                tripId: truck.assigned_trip_id,
              })
            }
          >
            <Ionicons name="navigate-circle-outline" size={22} color="white" />
            <Text className="ml-2 text-base font-semibold text-white">View Current Trip</Text>
          </TouchableOpacity>
        ) : (
          <View className="items-center w-full px-4 py-4 mt-2 bg-gray-100 rounded-lg">
            <Text className="text-gray-600">No active trip assigned</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TruckDetailCard;
