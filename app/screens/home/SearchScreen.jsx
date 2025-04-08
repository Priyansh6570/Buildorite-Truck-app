import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMineStore } from '../../store/mineStore';
import { useMaterialStore } from '../../store/materialStore';
import { useFetchMines } from '../../hooks/useMine';
import { useFetchMaterials } from '../../hooks/useMaterial';
import MineCard from '../../components/home/MineList';
import MaterialCard from '../../components/home/MaterialList';
import Toast from 'react-native-toast-message';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 60;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const SearchScreen = ({ route, navigation }) => {
  const { initialTab = 'mines', initialSearch = '' } = route.params || {};
  const [totalMinePages, setTotalMinePages] = useState(1);
  const [totalMaterialPages, setTotalMaterialPages] = useState(1);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [refreshing, setRefreshing] = useState(false);

  const searchInputRef = useRef(null);

  const scrollY = useRef(new Animated.Value(0)).current;

  const [localMineSearch, setLocalMineSearch] = useState('');
  const [localMaterialSearch, setLocalMaterialSearch] = useState('');

  const searchTimeout = useRef(null);

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

  const {
    data: mineData,
    refetch: refetchMines,
    isLoading: isMinesLoading,
    isFetching: isMinesFetching,
  } = useFetchMines(mineFilters, mineSearch);

  const {
    data: materialData,
    refetch: refetchMaterials,
    isLoading: isMaterialsLoading,
    isFetching: isMaterialsFetching,
  } = useFetchMaterials(materialFilters, materialSearch);

  useEffect(() => {
    // Reset both stores when the screen is first mounted
    const { resetStore: resetMineStore } = useMineStore.getState();
    const { resetStore: resetMaterialStore } = useMaterialStore.getState();
    
    resetMineStore();
    resetMaterialStore();

    setMineFilters({ 
      page: 1, 
      limit: 10, 
      sortBy: 'price', 
      order: 'asc', 
    });
    setMaterialFilters({ 
      page: 1, 
      limit: 10, 
      sortBy: 'price', 
      order: 'asc', 
    });

    if (initialTab === 'mines') {
      setSelectedTab('mines');
    } else {
      setSelectedTab('materials');
    }
  }, []);

  useEffect(() => {
    if (mineData?.totalPages) setTotalMinePages(mineData.totalPages);
  }, [mineData]);

  useEffect(() => {
    if (materialData?.totalPages) {
      setTotalMaterialPages(materialData.totalPages);
    }
  }, [materialData]);

  useEffect(() => {
    if (initialSearch) {
      if (initialTab === 'mines') {
        setMineSearch(initialSearch);
        setLocalMineSearch(initialSearch);
      } else if (initialTab === 'materials') {
        setMaterialSearch(initialSearch);
        setLocalMaterialSearch(initialSearch);
      }
    }

    setMineFilters({ ...mineFilters, page: 1 });
    setMaterialFilters({ ...materialFilters, page: 1 });
  }, [initialSearch, initialTab]);

  useEffect(() => {
    setLocalMineSearch(mineSearch);
  }, [mineSearch]);

  useEffect(() => {
    setLocalMaterialSearch(materialSearch);
  }, [materialSearch]);

  const handleSearchChange = (text) => {
    if (selectedTab === 'mines') {
      setLocalMineSearch(text);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setMineSearch(text);
      }, 300);
    } else {
      setLocalMaterialSearch(text);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        setMaterialSearch(text);
      }, 300);
    }
  };

  const clearSearch = () => {
    if (selectedTab === 'mines') {
      setLocalMineSearch('');
      setMineSearch('');
    } else {
      setLocalMaterialSearch('');
      setMaterialSearch('');
    }
    searchInputRef.current?.focus();
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    scrollY.setValue(0);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (selectedTab === 'mines') {
        setMineFilters({ ...mineFilters, page: 1 });
        await refetchMines();
      } else {
        setMaterialFilters({ ...materialFilters, page: 1 });
        await refetchMaterials();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreData = () => {
    const currentFilters = selectedTab === 'mines' ? mineFilters : materialFilters;
    const setFilters = selectedTab === 'mines' ? setMineFilters : setMaterialFilters;
    const totalPages = selectedTab === 'mines' ? totalMinePages : totalMaterialPages;
    const isLoading = selectedTab === 'mines' ? isMinesFetching : isMaterialsFetching;
  
    const currentPage = currentFilters.page || 1;
    
    if (isLoading || currentPage >= totalPages) {
      return;
    }
  
    const nextPage = currentPage + 1;
    setFilters({ ...currentFilters, page: nextPage });
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9, 0.8],
    extrapolate: 'clamp',
  });

  const currentData = selectedTab === 'mines' ? mines : materials;
  const isLoading = selectedTab === 'mines' ? isMinesLoading : isMaterialsLoading;
  const isFetching = selectedTab === 'mines' ? isMinesFetching : isMaterialsFetching;

  const ResultsCountComponent = () => {
    if (isLoading && !currentData?.length) return null;

    const count = currentData?.length || 0;
    return (
      <View className="px-6 py-3">
        <Text className="text-base text-gray-600">
          {count} result{count !== 1 ? 's' : ''} found
        </Text>
      </View>
    );
  };

  const renderEmptyComponent = () => {
    const isInitialLoading = isLoading && !currentData?.length;

    return (
      <View className="items-center justify-center flex-1 px-4 py-10">
        {isInitialLoading ? (
          <ActivityIndicator size="large" color="black" />
        ) : (
          <View className="items-center">
            <Ionicons name="search-outline" size={64} color="gray" />
            <Text className="mt-4 text-lg text-center text-gray-500">
              {selectedTab === 'mines'
                ? localMineSearch
                  ? 'No mines found matching your search'
                  : 'Search for mines'
                : localMaterialSearch
                ? 'No materials found matching your search'
                : 'Search for materials'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (isFetching || isLoading) {
      return (
        <View className="items-center pb-4">
          <ActivityIndicator size="small" color="black" />
          <Text className="mt-2 text-gray-600">Loading more...</Text>
        </View>
      );
    }
  
    if (currentData?.length && (selectedTab === 'mines' ? mineFilters.page >= totalMinePages : materialFilters.page >= totalMaterialPages )) {
      return (
          <View className="items-center py-4">
              <Text className="text-gray-600">You've reached the end.</Text>
          </View>
      );
    }
  
    return null;
  };

  const getItemKey = (item, index) => {
    return item._id 
      ? `${item._id}-${index}` 
      : `item-${index}-${selectedTab}`;
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'black',
          height: headerHeight,
          zIndex: 1000,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <View className="flex-row items-center justify-between px-8 pt-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Animated.Text
            style={{
              transform: [{ scale: titleScale }],
              color: 'white',
              fontWeight: 'bold',
              fontSize: 22,
            }}
          >
            {selectedTab === 'mines' ? 'Search Mines' : 'Search Materials'}
          </Animated.Text>
          <View style={{ width: 24 }} />
        </View>

        <Animated.View
          style={{
            opacity: headerOpacity,
            paddingHorizontal: 16,
            paddingBottom: 0,
            paddingTop: 8,
            marginBottom: 0,
          }}
        >
          <View className="flex-row px-4 py-2 mt-2 mb-4 bg-white shadow-md rounded-xl">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabChange('mines')}
              className={`flex-1 py-3 rounded-lg items-center ${
                selectedTab === 'mines' ? 'bg-[#2e2e2e]' : 'text-gray-600'
              }`}
            >
              <Text className={`font-medium text-lg ${selectedTab === 'mines' ? 'text-white' : 'text-gray-600'}`}>
                Mines
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleTabChange('materials')}
              className={`flex-1 py-3 rounded-lg items-center ${
                selectedTab === 'materials' ? 'bg-[#2e2e2e]' : 'text-gray-600'
              }`}
            >
              <Text className={`font-medium text-lg ${selectedTab === 'materials' ? 'text-white' : 'text-gray-600'}`}>
                Materials
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center px-4 py-3 bg-white rounded-lg shadow-md">
            <Ionicons name="search" size={20} color="gray" className="mr-3" />
            <TextInput
              ref={searchInputRef}
              placeholder={selectedTab === 'mines' ? 'Search mines...' : 'Search materials...'}
              value={selectedTab === 'mines' ? localMineSearch : localMaterialSearch}
              onChangeText={handleSearchChange}
              className="flex-1 py-1 text-black"
              autoCapitalize="none"
            />
            {(selectedTab === 'mines' ? localMineSearch : localMaterialSearch) ? (
              <TouchableOpacity onPress={clearSearch} className="">
                <Ionicons name="close-circle" size={18} color="gray" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.FlatList
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT,
          paddingBottom: 20,
          paddingHorizontal: 10,
          flexGrow: !currentData?.length ? 1 : undefined,
        }}
        data={currentData || []}
        keyExtractor={getItemKey}
        renderItem={({ item }) =>
          selectedTab === 'mines' ? <MineCard mine={item} /> : <MaterialCard material={item} />
        }
        ListHeaderComponent={<ResultsCountComponent />}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={loadMoreData}
        onEndReachedThreshold={1}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={21}
      />
    </View>
  );
};

export default SearchScreen;
