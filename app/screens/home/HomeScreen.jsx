import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";
import {
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFetchMines } from "../../hooks/useMine";
import { useFetchMaterials } from "../../hooks/useMaterial";
import { useAuthStore } from "../../store/authStore";
import { useMineStore } from "../../store/mineStore";
import { useMaterialStore } from "../../store/materialStore";
import HomeHeader from "../../components/home/HomeHeader";
import SearchBar from "../../components/home/SearchBar";
import TabSelector from "../../components/home/TabSelector";
import MineCard from "../../components/home/MineList";
import MaterialCard from "../../components/home/MaterialList";
import StatsSection from "../../components/home/StatsSection";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();

  const {
    filters: mineFilters,
    setMineFilters: setMineFilters,
    searchTerm: mineSearch,
    setSearchTerm: setMineSearch,
    mines,
  } = useMineStore();
  const {
    material_filters: materialFilters,
    setMaterialFilters: setMaterialFilters,
    searchTerm: materialSearch,
    setSearchTerm: setMaterialSearch,
    materials,
  } = useMaterialStore();
  const { user } = useAuthStore();
  const [selectedTab, setSelectedTab] = useState("mines");
  const { isLoading: isLoadingMines, refetch: refetchMines } = useFetchMines(
    { ...mineFilters, limit: 5, page: 1 },
    useMineStore.getState().searchTerm
  );
  const { isLoading: isLoadingMaterials, refetch: refetchMaterials } = useFetchMaterials(
    { ...materialFilters, limit: 5, page: 1 },
    useMaterialStore.getState().searchTerm
  );

  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      selectedTab === "mines"
        ? await refetchMines({ ...mineFilters, limit: 5, page: 1 })
        : await refetchMaterials({ ...materialFilters, limit: 5, page: 1 });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [selectedTab, mineFilters, materialFilters, refetchMines, refetchMaterials]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const displayData = (selectedTab === "mines" ? mines : materials)?.slice(0, 5) || [];

  const keyExtractor = (item, index) => {
    return `${selectedTab}-${item._id}-${index}`;
  };

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white">
      <View className="w-full h-[50%] absolute top-0" />

      <FlatList
        data={displayData}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <HomeHeader user={user.name} />
            <SearchBar
              selectedTab={selectedTab}
              mineSearch={mineSearch}
              setMineSearch={setMineSearch}
              materialSearch={materialSearch}
              setMaterialSearch={setMaterialSearch}
            />
            <StatsSection />
            <TabSelector
              selectedTab={selectedTab}
              setSelectedTab={setSelectedTab}
              mineSearch={mineSearch}
              materialSearch={materialSearch}
            />
          </>
        }
        renderItem={({ item }) =>
          selectedTab === "mines" ? (
            <MineCard mine={item} />
          ) : (
            <MaterialCard material={item} />
          )
        }
        ListEmptyComponent={
          isLoadingMines || isLoadingMaterials ? (
            <ActivityIndicator size="large" color="black" />
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500">No {selectedTab} available</Text>
            </View>
          )
        }
        ListFooterComponent={
          <View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("SearchScreen", {
                  initialTab: selectedTab,
                  initialSearch:
                    selectedTab === "mines" ? mineSearch : materialSearch,
                })
              }
              className="flex items-center py-4 bg-black rounded-lg w-[50%] mx-auto mb-8 shadow-lg"
            >
              <Text className="text-lg font-semibold text-white capitalize">
                View All {selectedTab}{" "}
                <AntDesign name="arrowright" size={16} color="white" />
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;