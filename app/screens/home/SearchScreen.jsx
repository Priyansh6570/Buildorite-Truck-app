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
  StyleSheet,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useMineStore } from '../../store/mineStore';
import { useMaterialStore } from '../../store/materialStore';
import { useFetchMines } from '../../hooks/useMine';
import { useFetchMaterials } from '../../hooks/useMaterial';
import MineCard from '../../components/home/MineList';
import MaterialCard from '../../components/home/MaterialList';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HEADER_MAX_HEIGHT = 150;
const HEADER_MIN_HEIGHT = 100;
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
    // setTimeout(() => {
    //   searchInputRef.current?.focus();
    // }, 100);
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
  const [searchFocused, setSearchFocused] = useState(false);

  // Update header animations to work with white background
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE / 2],
    extrapolate: 'clamp',
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const tabTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -33],
    extrapolate: 'clamp',
  });

  const searchTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -93],
    extrapolate: 'clamp',
  });

  const searchScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1],
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

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">

      <Animated.View
        style={[
          styles.headerContainer,
          {
            height: headerHeight,
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <View style={[styles.headerContent, { paddingTop: (insets.top)+10 }]}>
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-3 rounded-full shadow-xl bg-white/90 backdrop-blur"
            >
              <Feather name="arrow-left" size={20} color="#1F2937" />
            </TouchableOpacity>
          
          <Animated.Text
            style={[
              styles.headerTitle,
              {
                opacity: titleOpacity,
              },
            ]}
          >
            {selectedTab === 'mines' ? 'Search Mines' : 'Search Materials'}
          </Animated.Text>
          
          <View style={{ width: 24 }} />
        </View>

        <Animated.View
          style={[
            styles.tabContainer,
            {
              transform: [{ translateY: tabTranslateY }],
            },
          ]}
        >
          {/* <Text style={styles.categoryText}>CATEGORY</Text> */}
          <View style={styles.tabBackground}>
            <TouchableOpacity
              onPress={() => handleTabChange('mines')}
              style={styles.tabButton}
            >
              <View style={[
                styles.tabInner,
                selectedTab === 'mines' && styles.activeTabInner
              ]}>
                <Ionicons 
                  name="hammer" 
                  size={16} 
                  color={selectedTab === 'mines' ? '#6366f1' : '#6b7280'} 
                />
                <Text style={[
                  styles.tabText,
                  selectedTab === 'mines' && styles.activeTabText
                ]}>
                  Mines
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleTabChange('materials')}
              style={styles.tabButton}
            >
              <View style={[
                styles.tabInner,
                selectedTab === 'materials' && styles.activeTabInner
              ]}>
                <Ionicons 
                  name="layers" 
                  size={16} 
                  color={selectedTab === 'materials' ? '#6366f1' : '#6b7280'} 
                />
                <Text style={[
                  styles.tabText,
                  selectedTab === 'materials' && styles.activeTabText
                ]}>
                  Materials
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.searchContainer,
            {
              transform: [
                { translateY: searchTranslateY },
                { scale: searchScale },
              ],
              borderColor: searchFocused ? '#6366f1' : 'transparent',
              backgroundColor: searchFocused ? 'white' : '#f3f4f6',
              shadowOpacity: searchFocused ? 0.2 : 0,
            },
          ]}
        >
          <Ionicons 
            name="search" 
            size={18} 
            color={searchFocused ? '#6366f1' : '#9ca3af'} 
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            placeholder={selectedTab === 'mines' ? 'Search mines...' : 'Search materials...'}
            placeholderTextColor="#9ca3af"
            value={selectedTab === 'mines' ? localMineSearch : localMaterialSearch}
            onChangeText={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {(selectedTab === 'mines' ? localMineSearch : localMaterialSearch) ? (
            <TouchableOpacity 
              onPress={clearSearch} 
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </Animated.View>

      <Animated.FlatList
        contentContainerStyle={{
          paddingTop: HEADER_MAX_HEIGHT + 40,
          paddingBottom: 20,
          paddingHorizontal: 10,
          flexGrow: !currentData?.length ? 1 : undefined,
        }}
        data={currentData || []}
        keyExtractor={getItemKey}
        renderItem={({ item }) =>
          selectedTab === 'mines' ? <MineCard mine={item} /> : <MaterialCard material={item} routeNav={"MaterialDetail"} />
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


const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    zIndex: 1000,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#1f2937',
    fontWeight: '600',
    fontSize: 20,
  },
  tabContainer: {
    marginTop: 2,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tabBackground: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeTabInner: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#1f2937',
    fontSize: 16,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default SearchScreen;