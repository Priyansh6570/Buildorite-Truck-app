import { View, TextInput, TouchableOpacity, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const SearchBar = ({ selectedTab, mineSearch, setMineSearch, materialSearch, setMaterialSearch }) => {
  const clearSearch = () => {
    if (selectedTab === "mines") {
      setMineSearch("");
    } else {
      setMaterialSearch("");
    }
  };

  const currentSearch = selectedTab === "mines" ? mineSearch : materialSearch;

  return (
    <View className="px-6">
      <View className="flex-row items-center px-6 py-6 -mt-8 bg-white shadow-xl rounded-2xl">
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
    </View>
  );
};

export default SearchBar;
