import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFetchMaterialsByMine } from "../../hooks/useMaterial";
import MaterialCard from "./MaterialList";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MineMaterial = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mineId } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const insets = useSafeAreaInsets();

  const { data: materials, isLoading, isError, error, refetch } = useFetchMaterialsByMine(mineId);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const renderMaterialCard = ({ item }) => {
    return <MaterialCard material={item} routeNav={"MaterialDetail"} />;
  };

  const renderItem = ({ item }) => {
    return renderMaterialCard({ item });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-center px-8 pb-8 bg-gray-900" style={{ paddingTop: insets.top + 40 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-8 top-16 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center -mt-4">
          <Text className="text-3xl font-black text-white">Materials</Text>
          {materials && materials.length > 0 && (
            <Text className="text-sm text-gray-300">
              {materials.length} item{materials.length > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 font-medium text-gray-600">Loading materials...</Text>
        </View>
      ) : isError ? (
        <View className="items-center justify-center flex-1 px-6">
          <View className="w-full max-w-sm p-6 bg-white border border-gray-100 shadow-lg rounded-2xl">
            <View className="items-center">
              <View className="p-4 mb-4 bg-red-100 rounded-full">
                <Text className="text-2xl">⚠️</Text>
              </View>
              <Text className="mb-2 text-lg font-bold text-center text-gray-900">Loading Failed</Text>
              <Text className="mb-4 text-center text-gray-600">{error?.message || "Unable to load materials. Please try again."}</Text>
              <TouchableOpacity onPress={onRefresh} className="w-full px-6 py-3 bg-blue-600 rounded-xl">
                <Text className="font-bold text-center text-white">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : materials?.length === 0 ? (
        <View className="items-center justify-center flex-1 px-6">
          <View className="w-full max-w-sm p-6 bg-white border border-gray-100 shadow-lg rounded-2xl">
            <View className="items-center">
              <View className="p-4 mb-4 bg-blue-100 rounded-full">
                <Text className="text-2xl">📦</Text>
              </View>
              <Text className="mb-2 text-lg font-bold text-center text-gray-900">No Materials Found</Text>
              <Text className="mb-4 text-center text-gray-600">No materials have been added to this mine yet.</Text>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={materials}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}
    </View>
  );
};

export default MineMaterial;
