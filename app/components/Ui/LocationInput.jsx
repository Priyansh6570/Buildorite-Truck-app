import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, Image } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { FontAwesome6, Ionicons, Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const LocationInput = ({ onLocationSelect }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  const handleLocationSelect = (data, details) => {
    if (details) {
      const location = {
        address: data.description,
        coordinates: [details.geometry.location.lng, details.geometry.location.lat],
      };
      setSelectedLocation(data.description);
      onLocationSelect(location);
      setModalVisible(false);
    }
  };

  return (
    <View className="">
      <TouchableOpacity activeOpacity={0.8} onPress={() => setModalVisible(true)} pointerEvents="none" className="w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50 text-xl">
        <View className="flex-row items-center justify-between">
          <Text className={`${selectedLocation ? "text-black" : "text-gray-400"} text-xl py-2`}>{selectedLocation || "Enter mine location"}</Text>
          <FontAwesome6 name="chevron-right" size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>

      <Modal animationType="fade" visible={modalVisible}>
        <View className="flex-1 bg-gray-900">
          <View className="flex-row items-center justify-center px-8 py-12 bg-gray-900">
            <TouchableOpacity onPress={() => setModalVisible(false)} className="absolute left-8 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <Text className="ml-8 text-3xl font-black text-white">Select Mine Location</Text>
          </View>

          <View className="px-8 pb-4">
            <View className="p-5 mx-2 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-3xl">
              <View className="flex-row items-center pb-3 mb-4 border-b border-slate-600">
                <MaterialIcons name="help-outline" size={24} color="white" />
                <Text className="ml-3 text-lg font-bold text-white">Why do we need your location?</Text>
              </View>

              <View>
                <View className="flex-row items-start mb-3">
                  <View className="items-center w-6 pt-1 mr-2">
                    <FontAwesome5 name="truck" size={16} color="white" />
                  </View>
                  <Text className="flex-1 ml-2 text-sm leading-5 text-gray-300">To ensure your materials are delivered to the correct location.</Text>
                </View>

                <View className="flex-row items-start">
                  <View className="items-center w-6 pt-1 mr-2">
                    <MaterialIcons name="calculate" size={20} color="white" />
                  </View>
                  <Text className="flex-1 ml-2 text-sm leading-5 text-gray-300">To calculate accurate delivery charges based on distance.</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-1 p-6 mt-4 bg-white">
            <View className="p-8 mb-6 -mt-10 bg-white border shadow-xl shadow-black rounded-3xl border-slate-100">
              <View className="flex-row items-start mb-6">
                <View className="mr-5 overflow-hidden rounded-2xl">
                  <LinearGradient colors={["#60a5fa", "#3b82f6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-3">
                    <Ionicons name="search" size={24} color="white" />
                  </LinearGradient>
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900">Search Location</Text>
                  <Text className="text-lg text-gray-500">Type to find your mine location</Text>
                </View>
              </View>

              <View className="relative">
                <GooglePlacesAutocomplete
                  placeholder="Type a location..."
                  minLength={2}
                  fetchDetails={true}
                  debounce={500}
                  textInputProps={{
                    placeholderTextColor: "#9ca3af",
                    returnKeyType: "search",
                  }}
                  enablePoweredByContainer={false}
                  onPress={(data, details = null) => {
                    handleLocationSelect(data, details);
                  }}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                    language: "en",
                    components: "country:IN",
                  }}
                  styles={{
                    container: {
                      flex: 0,
                      zIndex: 0,
                    },
                    textInputContainer: {
                      width: "100%",
                      backgroundColor: "transparent",
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                    },
                    textInput: {
                      height: 60,
                      paddingLeft: 50,
                      paddingRight: 50,
                      paddingVertical: 16,
                      backgroundColor: "#f9fafb",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      fontSize: 19,
                      color: "#000",
                      fontWeight: "400",
                    },
                    listView: {
                      backgroundColor: "white",
                      borderRadius: 0,
                      marginTop: 4,
                      maxHeight: 300,
                      zIndex: 1001,
                    },
                    row: {
                      backgroundColor: "white",
                      padding: 0,
                      borderBottomWidth: 0,
                      marginHorizontal: 0,
                      marginVertical: 2,
                      borderRadius: 16,
                    },
                    separator: {
                      height: 0,
                    },
                  }}
                  renderRow={(data) => (
                    <View className="flex-row items-center justify-between w-full p-6 my-1 overflow-hidden bg-white border shadow-sm border-slate-100 rounded-2xl">
                      <View className="flex-row items-center space-x-4">
                        <View className="p-3 mr-4 bg-blue-100 rounded-lg">
                          <Ionicons name="location-sharp" size={20} color="#3b82f6" />
                        </View>
                        <View className="overflow-hidden w-[200px]">
                          <Text className="text-lg font-bold text-gray-800 text-ellipsis">{data.structured_formatting.main_text}</Text>
                          <Text className="text-base text-gray-500" numberOfLines={1}>
                            {data.structured_formatting.secondary_text}
                          </Text>
                        </View>
                      </View>
                      <FontAwesome6 name="chevron-right" size={16} color="#9ca3af" />
                    </View>
                  )}
                />
                <View className="absolute transform -translate-y-1/2 pointer-events-none left-5 top-[30px]">
                  <Ionicons name="location-sharp" size={22} color="#9ca3af" />
                </View>
              </View>
            </View>

            <View className="overflow-hidden border border-blue-300 rounded-3xl" style={{ zIndex: 1 }}>
              <LinearGradient colors={["#eff6ff", "#dbeafe"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center p-10 px-12 text-center">
                <View className="mb-6 overflow-hidden shadow-lg rounded-2xl elivation-2">
                  <LinearGradient colors={["#60a5fa", "#3b82f6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="px-10 py-8">
                    <FontAwesome6 name="map-pin" size={24} color="white" />
                  </LinearGradient>
                </View>
                <Text className="mb-2 text-2xl font-bold text-gray-800">Pin Your Location</Text>
                <Text className="text-lg text-center text-gray-600">Search and select the exact location of your mine</Text>
              </LinearGradient>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LocationInput;
