import { View, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

const TabSelector = ({ selectedTab, setSelectedTab, mineSearch, materialSearch }) => {
  const navigation = useNavigation();
  return (
    <View className="px-6 relative top-[-20px] mt-12">
      <View className="flex-row p-2 bg-[#F3F4F6] shadow-sm rounded-xl">
        <TouchableOpacity activeOpacity={1} onPress={() => setSelectedTab("mines")} className={`flex-1 py-4 rounded-lg items-center ${selectedTab === "mines" ? "bg-[#2e2e2e]" : "text-gray-600"}`}>
          <Text className={`font-semibold text-lg ${selectedTab === "mines" ? "text-white" : "text-gray-600"}`}>Mines</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={1} onPress={() => setSelectedTab("materials")} className={`flex-1 py-4 rounded-lg items-center ${selectedTab === "materials" ? "bg-[#2e2e2e]" : "text-gray-600"}`}>
          <Text className={`font-semibold text-lg ${selectedTab === "materials" ? "text-white" : "text-gray-600"}`}>Materials</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-between px-2 mt-8">
        <Text className="text-2xl font-semibold capitalize">Available {selectedTab}</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("SearchScreen", {
              initialTab: selectedTab,
              initialSearch: selectedTab === "mines" ? mineSearch : materialSearch,
            })
          }
        >
          <Text className="mt-1 font-medium text-indigo-600 text-md">View All →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TabSelector;
