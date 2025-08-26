import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFetchMyTrips } from '../../hooks/useTrip'; 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import ReusableBottomSheet from '../../components/Ui/ReusableBottomSheet';

// --- Constants ---
const SORT_OPTIONS = { NEWEST: "Newest First", OLDEST: "Oldest First" };
const TRIP_STATUSES = { active: 'Active', issue_reported: 'Issue Reported', completed: 'Completed', canceled: 'Canceled' };
const MILESTONE_STATUSES = { 
    trip_assigned: 'Awaiting Start', 
    trip_started: 'En Route to Mine', 
    arrived_at_pickup: 'At Mine', 
    loading_complete: 'Loading Complete', 
    pickup_verified: 'Pickup Verified', 
    en_route_to_delivery: 'En Route to Delivery', 
    arrived_at_delivery: 'At Delivery', 
    delivery_complete: 'Delivery Complete',
    delivery_verified: 'Trip Complete'
};

const ACTIVE_STATUSES = ['trip_started', 'arrived_at_pickup', 'loading_complete', 'pickup_verified', 'en_route_to_delivery', 'arrived_at_delivery', 'delivery_complete'];
const SCHEDULE_STATUSES = ['trip_assigned'];
const HISTORY_TRIP_STATUSES = ['completed', 'canceled', 'issue_reported'];

// --- Helper Functions ---
const getScheduleDate = (trip) => trip?.request_id?.finalized_agreement?.schedule?.date;

const getLatestMilestone = (trip) => {
    if (!trip || !trip.milestone_history || trip.milestone_history.length === 0) {
        return { key: 'N/A', label: 'Not Available', timestamp: null };
    }
    const lastMilestone = trip.milestone_history[trip.milestone_history.length - 1];
    return {
        key: lastMilestone.status,
        label: MILESTONE_STATUSES[lastMilestone.status] || 'In Progress',
        timestamp: lastMilestone.timestamp
    };
};

const getTripStartedTimestamp = (trip) => {
    const tripStartedMilestone = trip?.milestone_history?.find(m => m.status === 'trip_started');
    return tripStartedMilestone?.timestamp;
};

const getDeliveryVerifiedTimestamp = (trip) => {
    const deliveryVerifiedMilestone = trip?.milestone_history?.find(m => m.status === 'delivery_verified');
    return deliveryVerifiedMilestone?.timestamp;
};

const formatTimeElapsed = (startTime) => {
    if (!startTime) return 'N/A';
    const now = new Date();
    const start = new Date(startTime);
    const totalMinutes = differenceInMinutes(now, start);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

const formatDaysRemaining = (scheduleDate) => {
    if (!scheduleDate) return { text: 'N/A', isOverdue: false };
    const now = new Date();
    const schedule = new Date(scheduleDate);
    const daysDiff = differenceInDays(schedule, now);
    
    if (daysDiff > 0) {
        return { text: `${daysDiff} days`, isOverdue: false };
    } else if (daysDiff === 0) {
        const hoursDiff = differenceInHours(schedule, now);
        if (hoursDiff > 0) {
            return { text: `${hoursDiff} hours`, isOverdue: false };
        } else {
            const minutesDiff = differenceInMinutes(schedule, now);
            if (minutesDiff > 0) {
                return { text: `${minutesDiff} min`, isOverdue: false };
            } else {
                return { text: 'Due now', isOverdue: true };
            }
        }
    } else {
        const absDays = Math.abs(daysDiff);
        if (absDays === 0) {
            const absHours = Math.abs(differenceInHours(schedule, now));
            return { text: `${absHours}h overdue`, isOverdue: true };
        }
        return { text: `${absDays}d overdue`, isOverdue: true };
    }
};

const formatTripDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMinutes = differenceInMinutes(end, start);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

// --- Sub-components ---
const ScreenHeader = ({ onFilterPress }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    return (
        <View style={{ paddingTop: insets.top }} className="bg-white">
            <View className="flex-row items-center justify-between p-6 pb-4">
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    className="p-3 bg-gray-100 border border-slate-200 rounded-xl"
                >
                    <Feather name="arrow-left" size={24} color="#1f2937" />
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold text-center text-gray-900">
                    My Trips
                </Text>
                <TouchableOpacity
                    onPress={onFilterPress}
                    activeOpacity={0.8}
                    className="overflow-hidden rounded-xl"
                >
                    <LinearGradient
                        colors={["#212B39", "#4A5462"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-3"
                    >
                        <FontAwesome6 name="filter" size={16} color="white" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const StatusBadge = ({ status, tab }) => {
    let displayStatus = status;
    let styles = {};
    
    if (tab === 'Active') {
        displayStatus = 'active';
        styles = { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100' };
    } else if (tab === 'Schedule') {
        displayStatus = 'pending';
        styles = { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-500', border: 'border-yellow-100' };
    } else {
        // History tab - use actual status
        const statusStyles = {
            completed: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
            canceled: { dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
            issue_reported: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
        };
        styles = statusStyles[status] || statusStyles.completed;
        displayStatus = status === 'issue_reported' ? 'issue reported' : status;
    }

    return (
        <View className={`flex-row items-center self-start px-3 py-1 mt-1 border rounded-full ${styles.bg} ${styles.border}`}>
            <View className={`w-2 h-2 mr-1.5 rounded-full ${styles.dot}`} />
            <Text className={`text-sm font-bold capitalize ${styles.text}`}>{displayStatus}</Text>
        </View>
    );
};

const InfoBox = ({ icon, iconColor, title, value, isAnimated = false, isOverdue = false, accentColor = null }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isAnimated) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(animValue, { toValue: 1, duration: 800, useNativeDriver: false }),
                    Animated.timing(animValue, { toValue: 0, duration: 800, useNativeDriver: false }),
                ])
            ).start();
        }
    }, [isAnimated, animValue]);

    const animatedStyle = {
        backgroundColor: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['#F9FAFB', '#FEF3C7']
        })
    };

    let boxStyle = 'bg-[#F9FAFB]';
    let textStyle = 'text-gray-900';
    
    if (accentColor === 'green') {
        boxStyle = 'bg-green-50 border border-green-200';
        textStyle = 'text-green-800';
    } else if (accentColor === 'red' || isOverdue) {
        boxStyle = 'bg-red-50 border border-red-200';
        textStyle = 'text-red-800';
    } else if (accentColor === 'orange') {
        boxStyle = 'bg-orange-50 border border-orange-200';
        textStyle = 'text-orange-800';
    }

    return (
        <Animated.View style={[{ width: '48%' }, isAnimated && animatedStyle]} className={`p-4 rounded-xl ${boxStyle}`}>
            <View className="flex-row items-center">
                <FontAwesome6 name={icon} size={12} color={iconColor} />
                <Text className="ml-2 text-sm font-semibold text-gray-500">{title}</Text>
            </View>
            <Text className={`mt-1 text-base font-bold ${textStyle}`} numberOfLines={1}>{value}</Text>
            {isAnimated && <Text className="text-xs font-semibold text-amber-600">Awaiting Verification</Text>}
        </Animated.View>
    );
};

const TripCard = ({ trip, tab }) => {
    const navigation = useNavigation();
    const scheduleDate = getScheduleDate(trip);
    const latestMilestone = getLatestMilestone(trip);
    const isActionRequired = latestMilestone.key === 'delivery_complete';
    
    // Dynamic data based on tab
    let dynamicValue = 'N/A';
    let dynamicTitle = 'Status';
    let dynamicIcon = 'clock';
    let dynamicColor = '#3B82F6';
    let isOverdue = false;
    let accentColor = null;
    
    if (tab === 'Active') {
        const tripStarted = getTripStartedTimestamp(trip);
        dynamicValue = formatTimeElapsed(tripStarted);
        dynamicTitle = 'Time Elapsed';
        dynamicIcon = 'clock';
    } else if (tab === 'Schedule') {
        const remaining = formatDaysRemaining(scheduleDate);
        dynamicValue = remaining.text;
        dynamicTitle = 'Starts In';
        dynamicIcon = 'calendar-days';
        isOverdue = remaining.isOverdue;
    } else {
        // History tab
        if (trip.status === 'completed') {
            dynamicValue = 'Trip Completed';
            dynamicTitle = 'Status';
            dynamicIcon = 'check-circle';
            dynamicColor = '#16A34A';
            accentColor = 'green';
        } else if (trip.status === 'canceled') {
            dynamicValue = 'Canceled';
            dynamicTitle = 'Status';
            dynamicIcon = 'times-circle';
            dynamicColor = '#EF4444';
            accentColor = 'red';
        } else if (trip.status === 'issue_reported') {
            dynamicValue = 'Issue Reported';
            dynamicTitle = 'Status';
            dynamicIcon = 'triangle-exclamation';
            dynamicColor = '#F97316';
            accentColor = 'orange';
        }
    }
    
    // Footer content based on tab and status
    let footerContent = null;
    if (tab === 'History') {
        if (trip.status === 'completed') {
            const tripStarted = getTripStartedTimestamp(trip);
            const deliveryVerified = getDeliveryVerifiedTimestamp(trip);
            const duration = formatTripDuration(tripStarted, deliveryVerified);
            const completedDate = trip.completed_at ? format(new Date(trip.completed_at), "MMM d, yyyy 'at' h:mm a") : 'N/A';
            footerContent = (
                <View>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="calendar-check" size={14} color="#16A34A" />
                        <Text className="mt-1 ml-2 text-sm font-semibold text-gray-500">Completed</Text>
                    </View>
                    <Text className="mt-1 font-semibold text-gray-800" numberOfLines={1}>
                        {completedDate} • Duration: {duration}
                    </Text>
                </View>
            );
        } else if (trip.status === 'canceled') {
            footerContent = (
                <View>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="times-circle" size={14} color="#EF4444" />
                        <Text className="mt-1 ml-2 text-sm font-semibold text-gray-500">Cancellation Reason</Text>
                    </View>
                    <Text className="mt-1 font-semibold text-gray-800" numberOfLines={1}>
                        {trip.cancel_reason || 'No reason provided'}
                    </Text>
                </View>
            );
        } else if (trip.status === 'issue_reported') {
            footerContent = (
                <View>
                    <View className="flex-row items-center">
                        <FontAwesome6 name="triangle-exclamation" size={14} color="#F97316" />
                        <Text className="mt-1 ml-2 text-sm font-semibold text-gray-500">Issue Details</Text>
                    </View>
                    <Text className="mt-1 font-semibold text-gray-800" numberOfLines={1}>
                        {trip.issue?.reason || 'Issue reported'} {trip.issue?.notes ? `• ${trip.issue.notes}` : ''}
                    </Text>
                </View>
            );
        }
    } else {
        // Default destination footer for Active and Schedule tabs
        footerContent = (
            <View>
                <View className="flex-row items-center">
                    <FontAwesome6 name="location-dot" size={14} color="#EF4444" />
                    <Text className="mt-1 ml-2 text-sm font-semibold text-gray-500">Destination</Text>
                </View>
                <Text className="mt-1 font-semibold text-gray-800" numberOfLines={1}>
                    {trip.destination?.address?.split(',')[0] || 'Not available'}
                </Text>
            </View>
        );
    }

    return (
        <View className="p-6 py-8 mb-4 bg-white border shadow-md border-slate-100 rounded-3xl">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-4">
                    <Text className="text-lg font-extrabold text-gray-900" numberOfLines={1}>
                        {trip.request_id?.material_id?.name}
                    </Text>
                    <StatusBadge status={trip.status} tab={tab} />
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('TripDetail', { tripId: trip._id })}
                    className="px-4 py-2 bg-black rounded-xl"
                >
                    <Text className="font-bold text-white">Details</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap justify-between mt-4 gap-y-3">
                <InfoBox 
                    icon="calendar-days" 
                    iconColor="#3B82F6" 
                    title="Schedule" 
                    value={scheduleDate ? format(new Date(scheduleDate), "MMM d, yyyy") : 'N/A'} 
                />
                <InfoBox 
                    icon="weight-hanging" 
                    iconColor="#16A34A" 
                    title="Quantity" 
                    value={`${trip.request_id?.finalized_agreement?.quantity} ${trip.request_id?.finalized_agreement?.unit?.name || 'Tons'}`} 
                />
                <InfoBox 
                    icon={dynamicIcon} 
                    iconColor={dynamicColor} 
                    title={dynamicTitle} 
                    value={dynamicValue}
                    isOverdue={isOverdue}
                    accentColor={accentColor}
                />
                <InfoBox 
                    icon="timeline" 
                    iconColor="#3B82F6" 
                    title="Milestone" 
                    value={latestMilestone.label} 
                    // isAnimated={isActionRequired} 
                />
            </View>

            <View className="px-3 pt-4 mt-4 border-t border-slate-100">
                {footerContent}
            </View>
        </View>
    );
};

const FilterOption = ({ label, isSelected, onPress, style }) => (
    <TouchableOpacity
        onPress={onPress}
        style={style}
        className={`flex-row items-center p-4 mb-3 border rounded-2xl ${
            isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"
        }`}
    >
        <Text className={`flex-1 font-semibold text-center ${isSelected ? "text-blue-600" : "text-gray-700"}`}>
            {label}
        </Text>
    </TouchableOpacity>
);

const FilterSection = ({ title, children }) => (
    <View className="mb-6">
        <Text className="mb-4 text-lg font-bold text-gray-800">{title}</Text>
        {children}
    </View>
);

// --- Main Screen Component ---
const TripScreen = () => {
    const route = useRoute();
    const { data: allTrips, isLoading, isError } = useFetchMyTrips();

    const [activeTab, setActiveTab] = useState('Active');
    const filterBottomSheetRef = useRef(null);
    
    const [filters, setFilters] = useState({ sortBy: SORT_OPTIONS.NEWEST, status: [], milestone: [] });
    const [tempFilters, setTempFilters] = useState(filters);

    const filteredAndSortedTrips = useMemo(() => {
        if (!allTrips) return [];
        
        let trips = [];
        
        if (activeTab === 'Active') {
            trips = allTrips.filter(trip => {
                const lastMilestone = getLatestMilestone(trip).key;
                return ACTIVE_STATUSES.includes(lastMilestone);
            });
        } else if (activeTab === 'Schedule') {
            trips = allTrips.filter(trip => {
                const lastMilestone = getLatestMilestone(trip).key;
                return SCHEDULE_STATUSES.includes(lastMilestone);
            });
        } else {
            trips = allTrips.filter(trip => HISTORY_TRIP_STATUSES.includes(trip.status));
        }

        if (filters.status.length > 0) {
            if (activeTab === 'History') {
                trips = trips.filter(trip => filters.status.includes(trip.status));
            } else {
                trips = trips.filter(trip => {
                    const lastMilestone = getLatestMilestone(trip).key;
                    return filters.status.includes(lastMilestone);
                });
            }
        }

        if (activeTab !== 'History' && filters.milestone.length > 0) {
            trips = trips.filter(trip => {
                const lastMilestone = getLatestMilestone(trip).key;
                return lastMilestone && filters.milestone.includes(lastMilestone);
            });
        }

        trips.sort((a, b) => {
            const dateA = getScheduleDate(a) || a.createdAt;
            const dateB = getScheduleDate(b) || b.createdAt;
            if (filters.sortBy === SORT_OPTIONS.OLDEST) {
                return new Date(dateA) - new Date(dateB);
            }
            return new Date(dateB) - new Date(dateA);
        });
        return trips;
    }, [allTrips, activeTab, filters]);

    const openFilterSheet = () => {
        setTempFilters(filters);
        filterBottomSheetRef.current?.snapToIndex(0);
    };

    const applyFilters = () => {
        setFilters(tempFilters);
        filterBottomSheetRef.current?.close();
    };

    const resetFilters = () => {
        const initialFilters = { sortBy: SORT_OPTIONS.NEWEST, status: [], milestone: [] };
        setTempFilters(initialFilters);
        setFilters(initialFilters);
        filterBottomSheetRef.current?.close();
    };

    const handleTabChange = (newTab) => {
        if (newTab === activeTab) return;
        setActiveTab(newTab);
        const newFilters = { ...filters, status: [], milestone: [] };
        setFilters(newFilters);
        setTempFilters(newFilters);
    };

    const renderContent = () => {
        if (isLoading) return <ActivityIndicator size="large" color="#1f2937" className="mt-16" />;
        if (isError) return <Text className="mt-16 text-center text-red-500">Failed to load trips.</Text>;
        if (filteredAndSortedTrips.length === 0) return <Text className="mt-16 text-center text-gray-500">No trips found.</Text>;

        return (
            <View className="flex-1">
                <FlatList
                    data={filteredAndSortedTrips}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TripCard trip={item} tab={activeTab} />}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        );
    };
    
    const TABS = ["Active", "Schedule", "History"];

    const getFilterStatusOptions = () => {
        if (activeTab === 'History') {
            return HISTORY_TRIP_STATUSES.map(status => ({
                key: status,
                label: TRIP_STATUSES[status]
            }));
        } else if (activeTab === 'Active') {
            return ACTIVE_STATUSES.map(status => ({
                key: status,
                label: MILESTONE_STATUSES[status]
            }));
        } else {
            return SCHEDULE_STATUSES.map(status => ({
                key: status,
                label: MILESTONE_STATUSES[status]
            }));
        }
    };

    return (
        <View style={styles.flexOne}>
            <ScreenHeader onFilterPress={openFilterSheet} />

            <View style={styles.tabContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => handleTabChange(tab)}
                        style={[
                            styles.tab,
                            activeTab === tab ? styles.activeTab : null
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab ? styles.activeTabText : null
                        ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="flex-1">
                {renderContent()}
            </View>

            <ReusableBottomSheet ref={filterBottomSheetRef}>
                <View className="flex-1 p-6 bg-gray-50">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-2xl font-bold text-gray-900">Sort & Filter</Text>
                        <TouchableOpacity onPress={resetFilters} className="px-4 py-2 bg-gray-200 rounded-full">
                            <Text className="font-bold text-gray-700">Reset</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="my-6 border-b border-gray-200" />
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <FilterSection title="Sort By">
                            <View className="flex-row justify-between">
                                {Object.values(SORT_OPTIONS).map(option => (
                                    <FilterOption
                                        key={option}
                                        label={option}
                                        style={{ width: "48%" }}
                                        isSelected={tempFilters.sortBy === option}
                                        onPress={() => setTempFilters(prev => ({ ...prev, sortBy: option }))}
                                    />
                                ))}
                            </View>
                        </FilterSection>

                        {activeTab!=='Schedule' && (<FilterSection title={activeTab === 'History' ? "Trip Status" : "Current Status"}>
                            <View className="flex-row flex-wrap justify-between">
                                {getFilterStatusOptions().map(({ key, label }) => (
                                    <FilterOption
                                        key={key}
                                        label={label}
                                        style={{ width: "48%" }}
                                        isSelected={tempFilters.status.includes(key)}
                                        onPress={() => setTempFilters(prev => ({
                                            ...prev,
                                            status: prev.status.includes(key)
                                                ? prev.status.filter(s => s !== key)
                                                : [...prev.status, key],
                                        }))}
                                    />
                                ))}
                            </View>
                        </FilterSection>)}

                        {/* {activeTab !== 'History' && (
                            <FilterSection title="Milestone Filter">
                                <View className="flex-row flex-wrap justify-between">
                                    {(activeTab === 'Active' ? ACTIVE_STATUSES : SCHEDULE_STATUSES).map(key => (
                                        <FilterOption
                                            key={key}
                                            label={MILESTONE_STATUSES[key]}
                                            style={{ width: "48%" }}
                                            isSelected={tempFilters.milestone.includes(key)}
                                            onPress={() => setTempFilters(prev => ({
                                                ...prev,
                                                milestone: prev.milestone.includes(key)
                                                    ? prev.milestone.filter(m => m !== key)
                                                    : [...prev.milestone, key],
                                            }))}
                                        />
                                    ))}
                                </View>
                            </FilterSection>
                        )} */}
                    </ScrollView>
                    <TouchableOpacity onPress={applyFilters} className="p-4 mt-4 bg-gray-800 rounded-2xl">
                        <Text className="text-lg font-bold text-center text-white">Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </ReusableBottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { 
        flex: 1, 
        backgroundColor: '#F9FAFB' 
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 6,
        marginHorizontal: 16,
        marginVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#000000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    tabText: {
        fontWeight: 'bold',
        color: '#818992',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
});

export default TripScreen;