import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFetchTruckOwners } from '../../hooks/useUser';
import { useDebounce } from '../../hooks/useDebounce';
import { useUserStore } from '../../store/userStore';

const TruckOwnerList = ({ navigation }) => {
  
  
  const { searchTerm, setSearchTerm, users, user_filters, setUserFilters, clearUsers } = useUserStore();
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  const { data: truckOwnersData, isLoading, isError, refetch, isFetching } = useFetchTruckOwners(user_filters, debouncedSearchTerm);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    clearUsers();
    setUserFilters(prevFilters => ({ ...prevFilters, page: 1 }));
  }, []);

  useEffect(() => {
    clearUsers();
    setSearchTerm(debouncedSearchTerm);
    setUserFilters(prevFilters => ({ ...prevFilters, page: 1 }));
    refetch();
  }, [debouncedSearchTerm]);

  const handleSearchChange = (text) => {
    setLocalSearchTerm(text);
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    setUserFilters(prevFilters => ({ ...prevFilters, page: 1 }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setUserFilters(prevFilters => ({ ...prevFilters, page: 1 }));
    refetch().finally(() => setRefreshing(false));
  }, [refetch, setUserFilters]);

  const loadMoreData = useCallback(() => {
    if (!isLoading && !isFetching && truckOwnersData?.totalPages > user_filters.page) {
      setUserFilters(prevFilters => ({ ...prevFilters, page: prevFilters.page + 1 }));
    }
  }, [isLoading, isFetching, truckOwnersData?.totalPages, user_filters.page, setUserFilters]);

  const renderItem = ({ item }) => {
    const isTruckOwner = item.role === 'truck_owner';
    const roleText = isTruckOwner ? 'Truck Owner' : 'Mine Owner';
    const roleIcon = isTruckOwner ? 'truck-outline' : 'excavator';

    return (
      <View className="flex-row items-center justify-between p-4 mx-4 mb-3 bg-white shadow-md rounded-2xl">
        <View>
          <Text className="text-lg font-bold text-black capitalize">{item.name}</Text>
          <Text className="mt-1 text-sm text-gray-500">{roleText}</Text>
        </View>
        <View className="p-2 rounded-lg bg-indigo-50">
          <MaterialCommunityIcons name={roleIcon} size={24} color="#4F46E5" />
        </View>
      </View>
    );
  };

  const ListEmptyComponent = () => (
    <View className="items-center justify-center flex-1 p-5">
      {isLoading ? (
        <Text className="text-gray-700">Fetching Owners...</Text>
      ) : isError ? (
        <Text className="text-red-500">Failed to load owners.</Text>
      ) : users && users.length === 0 ? (
        <Text className="text-gray-700">No owners found.</Text>
      ) : (
        <Text className="text-gray-700">Users state is undefined or null</Text>
      )}
    </View>
  );

  const ListFooterComponent = () =>
    (isLoading || isFetching) ? (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="black" />
      </View>
    ) : null;

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 pb-6 bg-black">
        <View className="flex-row items-center justify-between pb-4">
                  <TouchableOpacity onPress={() => navigation.goBack()} className="">
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                  <Text
                    style={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: 22,
                    }}
                  > 
                  Connect with Owners
                  </Text>
                  <View style={{ width: 24 }} />
                </View>
        <View className="flex-row items-center px-4 py-3 bg-white rounded-lg shadow-md">
          <Ionicons name="search" size={20} color="gray" className="mr-3" />
          <TextInput
            placeholder="Search by name, phone number or mine name"
            value={localSearchTerm}
            onChangeText={handleSearchChange}
            className="flex-1 py-1 text-black"
            autoCapitalize="none"
          />
          {localSearchTerm ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={18} color="gray" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading && !users.length ? (
        <View className="items-center justify-center flex-1 bg-white">
          <ActivityIndicator size="large" color="black" />
          <Text className="mt-2 text-gray-700">Loading owners...</Text>
        </View>
      ) : (
        <FlatList
          className="pt-4 bg-white"
          data={users}
          keyExtractor={(item, index) => item._id + '-' + index}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
        />
      )}
    </View>
  );
};

export default TruckOwnerList;