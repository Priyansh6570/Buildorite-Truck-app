import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMineStore } from "../../store/mineStore";
import { useMaterialStore } from "../../store/materialStore";

const FilterModal = ({ isVisible, onClose, onReset }) => {
  const { filters: mineFilters, setFilters: setMineFilters } = useMineStore();
  const { filters: materialFilters, setFilters: setMaterialFilters } =
    useMaterialStore();
  const [selectedTab, setSelectedTab] = useState("mines");
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  // Get the active filters based on selected tab
  const activeFilters = selectedTab === "mines" ? mineFilters : materialFilters;
  const setActiveFilters =
    selectedTab === "mines" ? setMineFilters : setMaterialFilters;

  // Check location permission when the modal opens
  useEffect(() => {
    if (isVisible) {
      checkLocationPermission();
    }
  }, [isVisible]);

  // Check if location permissions are granted
  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === "granted");

    // If we already have coordinates in filters, enable the toggle
    const hasCoordinates =
      selectedTab === "mines"
        ? mineFilters.lat && mineFilters.lng
        : materialFilters.lat && materialFilters.lng;

    setLocationEnabled(status === "granted" && hasCoordinates);
  };

  // Toggle sort by distance
  const toggleSortByDistance = async (value) => {
    if (value) {
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        setActiveFilters({
          sortBy: "distance",
          lat: latitude,
          lng: longitude,
        });
        setLocationEnabled(true);
      } catch (error) {
        console.error("Error getting location:", error);
        setLocationEnabled(false);
      }
    } else {
      // Reset to default sorting
      setActiveFilters({
        sortBy: "price",
        lat: null,
        lng: null,
      });
      setLocationEnabled(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    // Update location toggle based on current filters for the selected tab
    const hasCoordinates =
      tab === "mines"
        ? mineFilters.lat &&
          mineFilters.lng &&
          mineFilters.sortBy === "distance"
        : materialFilters.lat &&
          materialFilters.lng &&
          materialFilters.sortBy === "distance";

    setLocationEnabled(locationPermission && hasCoordinates);
  };

  // Handle reset
  const handleReset = () => {
    onReset();
    setLocationEnabled(false);
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-4/5 overflow-hidden bg-white rounded-lg">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 bg-black">
            <Text className="text-lg font-bold text-white">Filter Options</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View className="flex-row bg-gray-100">
            <TouchableOpacity
              onPress={() => handleTabChange("mines")}
              className={`flex-1 py-3 items-center ${
                selectedTab === "mines" ? "border-b-2 border-black" : ""
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedTab === "mines" ? "text-black" : "text-gray-500"
                }`}
              >
                Mines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTabChange("materials")}
              className={`flex-1 py-3 items-center ${
                selectedTab === "materials" ? "border-b-2 border-black" : ""
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedTab === "materials" ? "text-black" : "text-gray-500"
                }`}
              >
                Materials
              </Text>
            </TouchableOpacity>
          </View>

          <View className="px-4 py-6">
            <Text className="mb-4 text-lg font-semibold">Sort Options</Text>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons
                  name="location"
                  size={20}
                  color="#555"
                  className="mr-2"
                />
                <Text className="text-base">Sort by Distance</Text>
              </View>
              <Switch
                trackColor={{ false: "#d1d1d1", true: "#ccc" }}
                thumbColor={locationEnabled ? "black" : "#f4f4f4"}
                ios_backgroundColor="#d1d1d1"
                onValueChange={toggleSortByDistance}
                value={locationEnabled}
                disabled={!locationPermission}
              />
            </View>

            {!locationPermission && (
              <View className="p-3 mb-4 rounded-md bg-yellow-50">
                <Text className="text-sm text-yellow-800">
                  Location permission is required to sort by distance. Please
                  enable location permissions in your device settings.
                </Text>
              </View>
            )}

            {/* Current Sorting */}
            <View className="p-3 mt-2 bg-gray-100 rounded-md">
              <Text className="text-sm text-gray-700">
                Current sorting:{" "}
                <Text className="font-semibold">
                  {activeFilters.sortBy === "distance"
                    ? "Distance (nearest first)"
                    : "Price (lowest first)"}
                </Text>
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row justify-between p-4 border-t border-gray-200">
            <TouchableOpacity onPress={handleReset} className="px-4 py-2">
              <Text className="font-medium text-red-500">Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 bg-black rounded-md"
            >
              <Text className="font-medium text-white">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;
