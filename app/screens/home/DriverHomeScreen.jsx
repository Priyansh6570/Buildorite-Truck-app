import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  ActivityIndicator,
  StatusBar,
  Text,
  RefreshControl,
  FlatList,
} from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useFetchMyTruck } from "../../hooks/useTruck";
import HomeHeader from "../../components/DriverHome/HomeHeader";
import StatsSection from "../../components/DriverHome/StatsSection";
import TruckDetailCard from "../../components/DriverHome/TruckDetailCard";
import { useNavigation } from "@react-navigation/native";

const DriverHomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  console.log("User Data:", user);

  const { data: myTruck, isLoading: isFetchingTruck, refetch: refetchTruck } = useFetchMyTruck({ 
    enabled: user?.role === 'driver', 
  });
console.log("My Truck Data:", myTruck);

  const fetchData = useCallback(async () => {
    try {
      await refetchTruck();
    } catch (error) {
      console.error("Error fetching truck data:", error);
    }
  }, [refetchTruck]);


  useEffect(() => {
    if (user?.role === 'driver' && !isFetchingTruck && !myTruck) {
      navigation.navigate('AddTruck');
    }
  }, [navigation, user?.role, isFetchingTruck, myTruck]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (isFetchingTruck && user?.role === 'driver') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="grey" />
        <Text>Checking Truck Details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please log in</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View className="w-full h-[50%] absolute top-0" />

      <FlatList
        data={[]}
        keyExtractor={() => "truck-details"}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <HomeHeader user={user.name} />
            <StatsSection truckOwner={myTruck?.truck_owner_id} />
          </>
        }
        ListEmptyComponent={
          <TruckDetailCard truck={myTruck} />
        }
        ListFooterComponent={
          <View className="pb-16" />
        }
      />
    </View>
  );
};

export default DriverHomeScreen;