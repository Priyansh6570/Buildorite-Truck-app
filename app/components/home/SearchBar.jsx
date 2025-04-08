import React from "react";
import { View, TextInput, TouchableOpacity, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SearchBar = ({ 
  selectedTab, 
  mineSearch, 
  setMineSearch, 
  materialSearch, 
  setMaterialSearch, 
  openFilterModal 
}) => {
  const clearSearch = () => {
    if (selectedTab === "mines") {
      setMineSearch('');
    } else {
      setMaterialSearch('');
    }
  };

  const currentSearch = selectedTab === "mines" ? mineSearch : materialSearch;

  return (
    <View className="px-12 bg-black">
      <View className="flex-row items-center px-4 py-4 mt-6 bg-white rounded-lg shadow-lg">
        <Ionicons name="search" size={20} color="gray" className="mr-3" />
        <TextInput
          placeholder={selectedTab === "mines" ? "Search mines..." : "Search materials..."}
          value={currentSearch}
          onChangeText={(text) => (selectedTab === "mines" ? setMineSearch(text) : setMaterialSearch(text))}
          className="flex-1 text-black"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        {currentSearch ? (
          <TouchableOpacity onPress={clearSearch} className="p-2">
            <Ionicons name="close-circle" size={18} color="gray" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View className="h-6" />
    </View>
  );
};

export default SearchBar;