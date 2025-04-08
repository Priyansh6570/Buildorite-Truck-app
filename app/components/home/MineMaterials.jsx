import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useFetchMaterialsByMine } from "../../hooks/useMaterial";
import MaterialCard from "./MaterialList";
import { useNavigation } from "@react-navigation/native";

const MineMaterial = () => {
    const navigation = useNavigation();
  const route = useRoute();
  const { mineId } = route.params;

  const {
    data: materials,
    isLoading,
    isError,
    error,
  } = useFetchMaterialsByMine(mineId);

  const renderItem = ({ item }) => <MaterialCard material={item} />;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-center p-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 p-4"
        >
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold">Materials</Text>
      </View>

      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : isError ? (
        <View className="items-center justify-center flex-1 p-4">
          <Text className="text-lg text-center text-red-500">
            Error loading materials: {error?.message || "Unknown error"}
          </Text>
        </View>
      ) : materials?.length === 0 ? (
        <View className="items-center justify-center flex-1 p-4">
          <Text className="text-lg text-center">
            No materials found for this mine.
          </Text>
        </View>
      ) : (
        <FlatList
          data={materials}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="h-4" />}
        />
      )}
    </View>
  );
};

export default MineMaterial;
