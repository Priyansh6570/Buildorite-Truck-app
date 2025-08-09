import React, { useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFetchMyTrips } from '../../hooks/useTrip';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import { format, isBefore, startOfToday } from 'date-fns';
import { TabView, TabBar } from 'react-native-tab-view';

const getScheduleDate = (trip) => trip?.request_id?.finalized_agreement?.schedule?.date;

// --- NEW: Helper to get milestone details ---
const getMilestoneInfo = (trip) => {
    if (!trip || !trip.milestone_history || trip.milestone_history.length === 0) {
        return { label: 'Scheduled', color: 'bg-gray-200', text: 'text-gray-800' };
    }
    const lastMilestone = trip.milestone_history[trip.milestone_history.length - 1].status;

    switch (lastMilestone) {
        case 'trip_assigned':
            return { label: 'New Trip', color: 'bg-blue-100', text: 'text-blue-800' };
        case 'trip_started':
        case 'en_route_to_delivery':
            return { label: 'En Route', color: 'bg-yellow-100', text: 'text-yellow-800' };
        case 'arrived_at_pickup':
            return { label: 'At Pickup Location', color: 'bg-indigo-100', text: 'text-indigo-800' };
        case 'loading_complete':
        case 'pickup_verified':
            return { label: 'Loaded', color: 'bg-purple-100', text: 'text-purple-800' };
        case 'arrived_at_delivery':
            return { label: 'At Delivery Location', color: 'bg-pink-100', text: 'text-pink-800' };
        case 'delivery_complete':
            return { label: 'Awaiting Verification', color: 'bg-teal-100', text: 'text-teal-800' };
        default:
            return { label: 'Scheduled', color: 'bg-gray-200', text: 'text-gray-800' };
    }
};

// --- UPDATED: Redesigned ActionCard ---
const ActionCard = ({ trip }) => {
    const navigation = useNavigation();
    const scheduleDate = getScheduleDate(trip);
    const isOverdue = scheduleDate && isBefore(new Date(scheduleDate), startOfToday());
    const milestoneInfo = getMilestoneInfo(trip);

    return (
        <View className="p-6 m-4 bg-white border border-gray-200 shadow-sm rounded-3xl">
            <View className="flex-row items-center justify-between">
                <View className={`px-3 py-1 rounded-full ${milestoneInfo.color}`}>
                    <Text className={`font-bold ${milestoneInfo.text}`}>{milestoneInfo.label}</Text>
                </View>
                {isOverdue && (
                    <View className="px-3 py-1 bg-red-100 rounded-full">
                        <Text className="font-bold text-red-600">Overdue</Text>
                    </View>
                )}
            </View>

            <Text className="mt-4 text-3xl font-bold text-gray-900">{trip.request_id?.material_id?.name}</Text>
            <Text className="text-lg text-gray-600">
                {trip.request_id?.finalized_agreement?.quantity} {trip.request_id?.finalized_agreement?.unit?.name || 'units'}
            </Text>

            {scheduleDate && (
                <Text className={`mt-1 text-base font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                    {format(new Date(scheduleDate), "eee, MMM d, yyyy")}
                </Text>
            )}

            <View className="my-6 border-t border-gray-200 border-dashed" />

            <View className="space-y-4">
                <View>
                    <Text className="mb-1 text-sm font-semibold text-gray-500">Pickup From:</Text>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="truck-pickup" size={16} color="#4B5563" />
                        <Text className="flex-1 ml-4 text-base font-bold text-gray-800" numberOfLines={1}>{trip.mine_id?.name}</Text>
                    </View>
                </View>
                <View>
                    <Text className="mb-1 text-sm font-semibold text-gray-500">Deliver To:</Text>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="map-marker-alt" size={16} color="#4B5563" />
                        <Text className="flex-1 ml-4 text-base font-bold text-gray-800" numberOfLines={1}>{trip.destination?.address}</Text>
                    </View>
                </View>
                <View>
                    <Text className="mb-1 text-sm font-semibold text-gray-500">Vehicle:</Text>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="truck" size={16} color="#4B5563" />
                        <Text className="flex-1 ml-4 text-base font-bold text-gray-800">{trip.truck_id?.name} ({trip.truck_id?.registration_number})</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                onPress={() => navigation.navigate('TripDetail', { tripId: trip._id })}
                className="flex-row items-center justify-center w-full py-4 mt-8 bg-gray-800 rounded-2xl"
            >
                <Feather name="eye" size={18} color="white" />
                <Text className="ml-3 text-lg font-bold text-white">View Details</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- UPDATED: Redesigned TripCard ---
const TripCard = ({ trip, isHorizontal }) => {
    const navigation = useNavigation();
    const cardWidth = isHorizontal ? 'w-80' : 'w-full'; // Increased width
    const scheduleDate = getScheduleDate(trip);
    
    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed': return { bg: 'bg-green-100', text: 'text-green-800' };
            case 'canceled': return { bg: 'bg-red-100', text: 'text-red-800' };
            default: return { bg: 'bg-blue-100', text: 'text-blue-800' };
        }
    };
    const statusStyle = getStatusStyle(trip.status);

    return (
        <TouchableOpacity 
            onPress={() => navigation.navigate('TripDetail', { tripId: trip._id })}
            className={`p-5 bg-white border border-gray-200 rounded-2xl ${isHorizontal ? 'mr-4' : 'mb-4'} ${cardWidth}`}
        >
            <View className="flex-row justify-between">
                <Text className="flex-1 text-lg font-bold text-gray-800" numberOfLines={1}>{trip.request_id?.material_id?.name}</Text>
                <View className={`px-3 py-1 ml-2 rounded-full ${statusStyle.bg}`}>
                    <Text className={`text-sm font-bold capitalize ${statusStyle.text}`}>{trip.status}</Text>
                </View>
            </View>
            
            {scheduleDate && (
                <Text className="mt-1 text-base font-medium text-gray-600">{format(new Date(scheduleDate), "eee, MMM d, yyyy")}</Text>
            )}

            <View className="my-4 border-t border-gray-100" />
            
            <View className="space-y-2">
                <View className="flex-row items-center">
                    <FontAwesome6 name="truck-pickup" size={14} color="#6B7280" />
                    <Text className="flex-1 ml-3 text-sm text-gray-700" numberOfLines={1}>{trip.mine_id?.name}</Text>
                </View>
                <View className="flex-row items-center">
                    <FontAwesome6 name="map-marker-alt" size={14} color="#6B7280" />
                    <Text className="flex-1 ml-3 text-sm text-gray-700" numberOfLines={1}>{trip.destination?.address}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const EmptyState = ({ message }) => (
    <View className="items-center justify-center flex-1 p-8 mt-10">
        <FontAwesome6 name="road-circle-xmark" size={48} color="#D1D5DB" />
        <Text className="mt-4 text-lg font-bold text-gray-600">No Trips Found</Text>
        <Text className="text-base text-center text-gray-500">{message}</Text>
    </View>
);

// --- Main Screen Component ---
const TripsScreen = () => {
    const insets = useSafeAreaInsets();
    const { data: trips, isLoading, isError } = useFetchMyTrips();
    const [tabIndex, setTabIndex] = useState(0);
    const [routes] = useState([
        { key: 'scheduled', title: 'Scheduled' },
        { key: 'history', title: 'History' },
    ]);

    // --- UPDATED: Memoized trips with time-based categorization ---
    const categorizedTrips = useMemo(() => {
        if (!trips) return { currentTrip: null, upNext: [], scheduled: [], history: [] };

        const now = new Date();
        const sevenDaysFromNow = new Date(now.setDate(now.getDate() + 7));

        const active = trips
            .filter(t => t.status === 'active' && getScheduleDate(t))
            .sort((a, b) => new Date(getScheduleDate(a)) - new Date(getScheduleDate(b)));
            
        const past = trips
            .filter(t => (t.status === 'completed' || t.status === 'canceled') && getScheduleDate(t))
            .sort((a, b) => new Date(getScheduleDate(b)) - new Date(getScheduleDate(a)));

        const currentTrip = active.length > 0 ? active[0] : null;
        
        // The remaining active trips to be categorized
        const remainingActive = currentTrip ? active.filter(t => t._id !== currentTrip._id) : active;

        const upNext = remainingActive.filter(t => new Date(getScheduleDate(t)) <= sevenDaysFromNow);
        const scheduled = remainingActive.filter(t => new Date(getScheduleDate(t)) > sevenDaysFromNow);

        return { currentTrip, upNext, scheduled, history: past };
    }, [trips]);

    if (isLoading) {
        return <View style={styles.container}><ActivityIndicator size="large" color="#1f2937" /></View>;
    }

    if (isError) {
        return <EmptyState message="Could not load your trips. Please try again later." />;
    }

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'scheduled':
                return <FlatList
                    data={categorizedTrips.scheduled}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TripCard trip={item} />}
                    ListEmptyComponent={<Text className="p-8 text-center text-gray-500">No other scheduled trips.</Text>}
                    contentContainerStyle={{ padding: 16 }}
                />;
            case 'history':
                return <FlatList
                    data={categorizedTrips.history}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TripCard trip={item} />}
                    ListEmptyComponent={<Text className="p-8 text-center text-gray-500">No past trips found.</Text>}
                    contentContainerStyle={{ padding: 16 }}
                />;
            default:
                return null;
        }
    };
    
    // RENDER A SINGLE TOP-LEVEL LIST IF NO TRIPS ARE AVAILABLE
    if (!trips || trips.length === 0) {
        return (
            <View style={styles.flexOne}>
                 <View style={{ paddingTop: insets.top, ...styles.header }}>
                    <Text className="text-2xl font-bold text-gray-900">My Trips</Text>
                </View>
                <EmptyState message="You have no trips assigned to you yet." />
            </View>
        );
    }

    return (
        <View style={styles.flexOne} > 
            <View style={{ paddingTop: insets.top, ...styles.header }}>
                <Text className="text-3xl font-bold text-gray-900">My Trips</Text>
            </View>

            {/* --- 1. Action Zone --- */}
            {categorizedTrips.currentTrip ? (
                <ActionCard trip={categorizedTrips.currentTrip} />
            ) : (
                <View className="items-center p-8 m-4 bg-green-100 border border-green-200 rounded-3xl">
                     <Text className="text-lg font-bold text-green-800">All Caught Up! 🌴</Text>
                     <Text className="mt-1 text-base text-center text-green-700">You have no active trips right now.</Text>
                </View>
            )}

            {/* --- 2. Heads-Up Zone --- */}
            {categorizedTrips.upNext.length > 0 && (
                 <View className="pt-4">
                    <Text className="mx-6 mb-4 text-2xl font-bold text-gray-900">Up Next</Text>
                    <FlatList
                        data={categorizedTrips.upNext}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => <TripCard trip={item} isHorizontal />}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 24 }}
                    />
                </View>
            )}

            {/* --- 3. Reference Zone --- */}
            <View style={styles.tabContainer}>
                 <Text className="mx-6 mt-6 mb-2 text-2xl font-bold text-gray-900">All Trips</Text>
                <TabView
                    navigationState={{ index: tabIndex, routes }}
                    renderScene={renderScene}
                    onIndexChange={setTabIndex}
                    initialLayout={{ width: Dimensions.get('window').width }}
                    renderTabBar={props => 
                        <TabBar 
                            {...props} 
                            indicatorStyle={styles.tabIndicator}
                            style={styles.tabBar}
                            labelStyle={styles.tabLabel}
                            activeColor="#1F2937"
                            inactiveColor="#6B7280"
                        />
                    }
                />
            </View>
        </View>
    );
};

// --- Styles with more spacing ---
const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: '#F9FAFB' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 24, paddingBottom: 16, backgroundColor: 'white' },
    tabContainer: { flex: 1, marginTop: 16 },
    tabBar: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0, marginHorizontal: 16 },
    tabIndicator: { backgroundColor: '#1F2937', height: 4, borderRadius: 2 },
    tabLabel: { fontWeight: 'bold', textTransform: 'capitalize', fontSize: 16 },
});

export default TripsScreen;