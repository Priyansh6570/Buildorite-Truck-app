import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Platform, TextInput, FlatList, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useFetchRequestById, useUpdateRequestStatus, useAssignDriver } from '../../hooks/useRequest';
import { useFetchMyDrivers } from '../../hooks/useTruck';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import ReusableBottomSheet from '../../components/Ui/ReusableBottomSheet';

// --- Constants ---
const CANCELLATION_REASONS = [
    "Change of plans",
    "Found a better deal",
    "No longer needed",
    "Incorrect order",
];

// --- Helper Components ---
const DetailRow = ({ icon, label, value, children }) => (
    <View className="flex-row items-start mb-5">
        <FontAwesome6 name={icon} size={16} color="#4B5563" style={{ width: 24, textAlign: 'center', marginTop: 4 }} />
        <View className="flex-1 ml-4">
            <Text className="text-base font-semibold text-gray-500">{label}</Text>
            {value && <Text className="mt-1 text-lg font-bold text-gray-900">{value}</Text>}
            {children}
        </View>
    </View>
);

const GetDirectionsButton = ({ startLocation, endLocation, buttonText = "Get Directions" }) => {
    const openDirections = async () => {
        if (!endLocation?.coordinates) {
            Toast.show({ type: 'error', text1: 'Destination data is missing.' });
            return;
        }
        try {
            let startLat, startLng;
            if (startLocation?.coordinates) {
                [startLng, startLat] = startLocation.coordinates;
            } else {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Toast.show({ type: 'error', text1: 'Location Permission Denied', text2: 'Please enable location permissions.' });
                    return;
                }
                const currentLocation = await Location.getCurrentPositionAsync({});
                ({ latitude: startLat, longitude: startLng } = currentLocation.coords);
            }
            const [endLng, endLat] = endLocation.coordinates;
            const url = Platform.select({
                ios: `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${endLat},${endLng}&dirflg=d`,
                android: `google.navigation:q=${endLat},${endLng}&mode=d`
            });
            const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`;
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) await Linking.openURL(url);
            else await Linking.openURL(fallbackUrl);
        } catch (error) {
            console.error('Error opening directions:', error);
            Toast.show({ type: 'error', text1: 'Could not open maps.' });
        }
    };
    return (
        <TouchableOpacity onPress={openDirections} className="flex-row items-center justify-center w-full py-4 mt-2 bg-gray-800 rounded-2xl">
            <FontAwesome6 name="location-arrow" size={16} color="white" />
            <Text className="ml-3 text-lg font-bold text-white">{buttonText}</Text>
        </TouchableOpacity>
    );
};

const HistoryEntry = ({ entry, isLast, otherPartyName, userType }) => {
    const isYou = entry.by === userType;
    const actorName = isYou ? "You" : otherPartyName;
    const proposal = entry.proposal;
    return (
        <View className="flex-row mb-6">
            <View className="items-center w-8">
                <View className={`items-center justify-center w-8 h-8 rounded-full ${isYou ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    <FontAwesome6 name={isYou ? "user-tie" : "user"} size={14} color={isYou ? '#2563EB' : '#4B5563'} />
                </View>
                {!isLast && <View className="flex-1 w-0.5 bg-gray-200" />}
            </View>
            <View className="flex-1 pb-4 ml-4">
                <View className="p-4 bg-white border border-gray-100 rounded-xl">
                    <View className="flex-row justify-between">
                        <Text className="text-base font-bold text-gray-800">{actorName}</Text>
                        <Text className="text-sm text-gray-500">{format(new Date(entry.timestamp), "MMM d, h:mm a")}</Text>
                    </View>
                    <Text className="mt-2 text-lg font-semibold text-green-600">
                        ₹{proposal.price.toLocaleString('en-IN')} for {proposal.quantity} {proposal.unit.name}
                    </Text>
                    <View className="pt-3 mt-3 border-t border-gray-200 border-dashed">
                        {proposal.schedule?.date && (<View className="flex-row items-center mb-2"><FontAwesome6 name="calendar-day" size={14} color="#6B7280" /><Text className="ml-3 text-base font-medium text-gray-700">{format(new Date(proposal.schedule.date), "EEE, MMM d, yyyy")}</Text></View>)}
                        {proposal.attachments?.length > 0 && (<View className="mb-2">{proposal.attachments.map((file, index) => (<TouchableOpacity key={index} onPress={() => Linking.openURL(file.url)} className="flex-row items-center p-2 mt-1 rounded-md bg-gray-50"><FontAwesome6 name="paperclip" size={14} color="#4B5563" /><Text className="flex-1 ml-2 text-sm font-semibold text-blue-600 underline" numberOfLines={1}>{file.caption || `Attachment ${index + 1}`}</Text></TouchableOpacity>))}</View>)}
                        {proposal.comments && <Text className="text-base text-gray-600">{proposal.comments}</Text>}
                    </View>
                </View>
            </View>
        </View>
    );
};

// --- UPDATED: DriverCard Component ---
const DriverCard = ({ driver, isSelected, onSelect, requestScheduleDate }) => {
    const hasTruck = !!(driver.truck && driver.truck._id);
    const isBusy = hasTruck && driver.schedule?.date && requestScheduleDate && isSameDay(new Date(driver.schedule.date), new Date(requestScheduleDate));
    const isAvailable = hasTruck && !isBusy;

    const getStatus = () => {
        if (!hasTruck) return { text: "No Truck", style: "text-red-700 bg-red-100" };
        if (isBusy) return { text: `Busy on ${format(new Date(driver.schedule.date), 'MMM d')}`, style: "text-yellow-700 bg-yellow-100" };
        return { text: "Available", style: "text-green-700 bg-green-100" };
    };

    const statusInfo = getStatus();

    return (
        <TouchableOpacity
            onPress={() => isAvailable && onSelect(driver._id)}
            disabled={!isAvailable}
            className={`p-4 mb-3 border-2 rounded-2xl ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'} ${!isAvailable && 'opacity-50'}`}
        >
            <View className="flex-row items-center">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">{driver.name}</Text>
                    <Text className="text-base text-gray-500">{driver.truck?.name || 'No truck assigned'}</Text>
                    {driver.truck?.reg && <Text className="text-sm text-gray-400">{driver.truck.reg}</Text>}
                </View>
                <View className={`px-3 py-1 rounded-full ${statusInfo.style}`}>
                    <Text className={`font-semibold`}>{statusInfo.text}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// --- Main Screen Component ---
const RequestDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { requestId, userType } = route.params;

    const { data: request, isLoading, isError, refetch } = useFetchRequestById(requestId);
    const { data: drivers, isLoading: isLoadingDrivers } = useFetchMyDrivers();
    const { mutate: updateStatus } = useUpdateRequestStatus();
    const { mutate: assignDriver } = useAssignDriver();

    const cancelBottomSheetRef = useRef(null);
    const acceptBottomSheetRef = useRef(null);
    const assignDriverSheetRef = useRef(null);

    const [cancellationReason, setCancellationReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [selectedDriverId, setSelectedDriverId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
    const [confirmationDetails, setConfirmationDetails] = useState(null);

    // --- UPDATED: Filtered Driver Lists ---
    const assignableDrivers = drivers?.filter(d => d.truck && d.truck._id);
    const availableDriversForChange = drivers?.filter(d => d.truck && d.truck._id && d._id !== request?.driver_id?._id);

    if (isLoading) return <View style={styles.container}><ActivityIndicator size="large" color="#1f2937" /></View>;
    if (isError || !request) return <View style={styles.container}><Text className="text-lg text-red-500">Could not load request details.</Text></View>;

    const agreement = request.finalized_agreement || request.current_proposal;
    const isMyTurn = (userType === 'buyer' && request.last_updated_by === 'seller');
    const otherPartyName = request.mine_id.name;
    const canCancel = userType === 'buyer' && !['accepted', 'rejected', 'canceled', 'completed', 'in_progress'].includes(request.status);
    const isPickup = agreement.delivery_method === 'pickup';

    const handleOpenCancelSheet = () => cancelBottomSheetRef.current?.snapToIndex(0);
    const handleCloseCancelSheet = () => cancelBottomSheetRef.current?.close();
    const handleCancelRequest = () => {
        if (isProcessing) return;
        const finalReason = customReason.trim() || cancellationReason;
        if (!finalReason) {
            Toast.show({ type: 'error', text1: 'Please select or provide a reason.' });
            return;
        }
        setIsProcessing(true);
        updateStatus({ requestId, status: 'canceled', reason: finalReason }, {
            onSuccess: () => { Toast.show({ type: 'success', text1: 'Request Canceled' }); handleCloseCancelSheet(); navigation.goBack(); },
            onError: (err) => Toast.show({ type: 'error', text1: 'Failed to cancel', text2: err.message }),
            onSettled: () => setIsProcessing(false)
        });
    };

    const handleOpenAcceptSheet = () => acceptBottomSheetRef.current?.snapToIndex(0);
    const handleCloseAcceptSheet = () => {
        setSelectedDriverId(null);
        acceptBottomSheetRef.current?.close();
    };
    
    const handleAcceptanceFlow = ({ assignLater = false }) => {
        if (!assignLater && isPickup && !selectedDriverId) {
            Toast.show({ type: 'error', text1: 'Please select a driver or choose to assign later.' });
            return;
        }
        const details = { 
            assignLater, 
            driver: assignLater ? null : drivers.find(d => d._id === selectedDriverId) 
        };
        setConfirmationDetails(details);
        setConfirmationModalVisible(true);
        handleCloseAcceptSheet();
    };

    const executeAcceptance = () => {
        if (isProcessing) return;
        setIsProcessing(true);
        updateStatus({ requestId, status: 'accepted' }, {
            onSuccess: () => {
                if (isPickup && !confirmationDetails.assignLater && confirmationDetails.driver) {
                    assignDriver({ requestId, driver_id: confirmationDetails.driver._id }, {
                        onSuccess: () => { Toast.show({ type: 'success', text1: 'Accepted & Driver Assigned!' }); refetch(); },
                        onError: (err) => Toast.show({ type: 'error', text1: 'Accepted, but failed to assign driver.', text2: err.message }),
                        onSettled: () => { setConfirmationModalVisible(false); setIsProcessing(false); }
                    });
                } else {
                    Toast.show({ type: 'success', text1: 'Request Accepted!', text2: 'Agreement has been finalized.' });
                    setConfirmationModalVisible(false);
                    setIsProcessing(false);
                    refetch();
                }
            },
            onError: (err) => { Toast.show({ type: 'error', text1: 'Failed to accept', text2: err.message }); setIsProcessing(false); }
        });
    };

    const handleOpenAssignDriverSheet = () => assignDriverSheetRef.current?.snapToIndex(0);
    const handleCloseAssignDriverSheet = () => {
        setSelectedDriverId(null);
        assignDriverSheetRef.current?.close();
    };
    const handleConfirmAssignDriver = () => {
        if (!selectedDriverId) {
            Toast.show({ type: 'error', text1: 'Please select a driver.' });
            return;
        }
        setIsAssigning(true);
        assignDriver({ requestId, driver_id: selectedDriverId }, {
            onSuccess: () => {
                Toast.show({ type: 'success', text1: 'Driver Assigned Successfully!' });
                handleCloseAssignDriverSheet();
                refetch();
            },
            onError: (err) => Toast.show({ type: 'error', text1: 'Failed to assign driver', text2: err.message }),
            onSettled: () => setIsAssigning(false)
        });
    };

    // --- UPDATED: renderActionPanel Logic ---
    const renderActionPanel = () => {
        const status = request.status;
        if (['rejected', 'canceled', 'completed'].includes(status)) {
            const isPositive = status === 'completed';
            return (
                <View className={`p-4 mx-6 my-4 ${isPositive ? 'bg-green-50' : 'bg-red-50'} rounded-2xl`}>
                    <Text className={`text-lg font-bold text-center ${isPositive ? 'text-green-700' : 'text-red-700'}`}>Request {status}</Text>
                    {(request.rejection_reason || request.cancellation_reason) && <Text className="mt-2 text-base text-center text-red-600">{request.rejection_reason || request.cancellation_reason}</Text>}
                </View>
            );
        }
        
        if (status === 'in_progress' && request.driver_id) {
            return (
                <View className="p-4 mx-6 my-4 space-y-3 bg-blue-50 rounded-2xl">
                    <Text className="text-lg font-bold text-center text-blue-700">Trip In Progress</Text>
                    <DetailRow icon="user-check" label="Assigned Driver" value={request.driver_id.name} />
                    {isPickup && (
                        <TouchableOpacity 
                            onPress={handleOpenAssignDriverSheet} 
                            className="flex-row items-center justify-center w-full px-4 py-3 mt-2 bg-blue-600 rounded-2xl"
                        >
                            <FontAwesome6 name="retweet" size={16} color="white" />
                            <Text className="ml-3 text-lg font-bold text-white">Change Driver</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )
        }

        if (status === 'accepted' && isPickup && !request.driver_id) {
            return (
                <View className="p-4 mx-6 my-4 space-y-3 bg-white border-2 border-yellow-300 rounded-3xl">
                    <Text className="text-lg font-bold text-center text-yellow-700">Agreement Finalized</Text>
                    <TouchableOpacity onPress={handleOpenAssignDriverSheet} className="items-center justify-center w-full px-4 py-3 bg-yellow-500 rounded-2xl">
                       <Text className="text-lg font-bold text-white">Assign a Driver</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        if (isMyTurn && (status === 'countered' || status === 'accepted')) {
            return (
                <View className="p-4 mx-6 my-4 space-y-3 bg-white border-2 border-green-200 rounded-3xl">
                    <View className="flex-row justify-around space-x-3">
                        <TouchableOpacity onPress={handleOpenAcceptSheet} className="items-center justify-center flex-1 px-4 py-3 bg-green-500 rounded-2xl">
                            <Text className="text-lg font-bold text-white">Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center justify-center flex-1 px-4 py-3 bg-gray-200 rounded-2xl" onPress={() => navigation.navigate('CounterRequest', { request })}>
                            <Text className="text-lg font-bold text-gray-800">Counter</Text>
                        </TouchableOpacity>
                    </View>
                    {canCancel && (<TouchableOpacity onPress={handleOpenCancelSheet} className="items-center justify-center w-full px-4 py-3 bg-red-100 rounded-2xl"><Text className="text-lg font-bold text-red-600">Cancel Request</Text></TouchableOpacity>)}
                </View>
            );
        }

        if (!isMyTurn && (status === 'countered' || status === 'accepted')) {
            return (
                <View className="p-4 mx-6 my-4 space-y-3 bg-blue-50 rounded-2xl">
                    <Text className="text-lg font-bold text-center text-blue-700">Awaiting response from {otherPartyName}...</Text>
                    {canCancel && (<TouchableOpacity onPress={handleOpenCancelSheet} className="items-center self-center justify-center px-6 py-2 mt-2 bg-red-100 rounded-full"><Text className="font-bold text-red-600">Cancel Request</Text></TouchableOpacity>)}
                </View>
            );
        }

        return null;
    };

    return (
        <View style={styles.flexOne}>
            <View style={{ paddingTop: insets.top, ...styles.header }}>
                <View className="flex-row items-center justify-between px-6">
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-xl"><Feather name="arrow-left" size={24} color="#1f2937" /></TouchableOpacity>
                    <Text className="text-xl font-bold text-center text-gray-900 capitalize" numberOfLines={1}>{otherPartyName}</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.flexOne} contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="p-6 m-6 mt-4 bg-white border border-gray-100 shadow-sm rounded-3xl">
                    <Text className="text-3xl font-extrabold text-gray-900">{request.material_id.name}</Text>
                    <View className="flex-row items-baseline mt-2">
                        <Text className="text-3xl font-bold text-green-600">₹{agreement.price.toLocaleString('en-IN')}</Text>
                        <Text className="ml-2 text-lg font-semibold text-gray-500">for {agreement.quantity} {agreement.unit.name}</Text>
                    </View>
                    <View className="my-6 border-t border-gray-200 border-dashed" />
                    {agreement.delivery_method === 'delivery' ? (<View><DetailRow icon='truck-fast' label="Delivery To" value={agreement.delivery_location?.address || 'Address not provided'}/><GetDirectionsButton startLocation={request.mine_id.location} endLocation={agreement.delivery_location} /></View>) : (<View><DetailRow icon='truck-pickup' label="Pickup from Mine" value="You will pick up the material from the mine location."/><GetDirectionsButton endLocation={request.mine_id.location} buttonText="Directions to Mine" /></View>)}
                </View>
                {renderActionPanel()}
                <View className="p-6 m-6 bg-white border border-gray-100 shadow-sm rounded-3xl">
                    <Text className="mb-6 text-xl font-bold text-gray-900">Proposal Details</Text>
                    <DetailRow icon="calendar-days" label="Proposed Schedule" value={format(new Date(agreement.schedule.date), "EEE, MMM d, yyyy")} />
                    {agreement.comments && <DetailRow icon="comment-dots" label="Comments" value={agreement.comments} />}
                    {agreement.attachments?.length > 0 && (<DetailRow icon="paperclip" label="Attachments">{agreement.attachments.map((file, index) => (<TouchableOpacity key={index} onPress={() => Linking.openURL(file.url)} className="flex-row items-center p-3 mt-2 bg-gray-100 rounded-lg"><FontAwesome6 name="file-alt" size={16} color="#4B5563" /><Text className="flex-1 ml-3 font-semibold text-blue-600 underline" numberOfLines={1}>{file.caption || `Attachment ${index + 1}`}</Text></TouchableOpacity>))}</DetailRow>)}
                </View>
                {request.history?.length > 0 && (<View className="p-6 mx-6"><Text className="mb-6 text-xl font-bold text-gray-900">Negotiation History</Text>{request.history.slice().reverse().map((entry, index) => (<HistoryEntry key={index} entry={entry} isLast={index === request.history.length - 1} otherPartyName={otherPartyName} userType={userType} />))}</View>)}
            
                <Modal transparent={true} visible={isConfirmationModalVisible} animationType="fade" onRequestClose={() => setConfirmationModalVisible(false)}>
                     <View style={styles.modalOverlay}>
                       <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>Confirm Agreement</Text>
                            <Text style={styles.modalSubtitle}>Review the final details before accepting.</Text>
                            <View style={styles.summaryCard}>
                                <DetailRow icon="box" label="Material" value={request.material_id.name} />
                                <DetailRow icon="money-bill-wave" label="Final Price" value={`₹${agreement.price.toLocaleString('en-IN')} for ${agreement.quantity} ${agreement.unit.name}`} />
                                <DetailRow icon="calendar-alt" label="Schedule" value={format(new Date(agreement.schedule.date), "EEE, MMM d, yyyy")} />
                                {confirmationDetails?.driver && (
                                    <>
                                        <View style={styles.separator} />
                                        <DetailRow icon="user-check" label="Assigned Driver" value={confirmationDetails.driver.name} />
                                        {/* --- UPDATED: Modal Vehicle Details --- */}
                                        <DetailRow icon="truck" label="Vehicle" value={`${confirmationDetails.driver.truck.name} (${confirmationDetails.driver.truck.reg})`} />
                                    </>
                                )}
                            </View>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity onPress={executeAcceptance} disabled={isProcessing} style={[styles.button, styles.sendButton]}>
                                    {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Accept Offer</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setConfirmationModalVisible(false)} style={[styles.button, styles.cancelButton]}>
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>

            {/* --- UPDATED: 'Accept' Bottom Sheet --- */}
            <ReusableBottomSheet ref={acceptBottomSheetRef} snapPoints={isPickup ? ['85%'] : ['60%']}>
                {isPickup ? (
                    <View className="flex-1 p-6">
                        <View className="items-center">
                            <View className="p-4 mb-4 bg-green-100 rounded-full"><FontAwesome6 name="user-check" size={28} color="#16A34A" /></View>
                            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Assign a Driver</Text>
                            <Text className="mb-6 text-base text-center text-gray-600">Select an available driver for this pickup request.</Text>
                        </View>
                        {isLoadingDrivers ? <ActivityIndicator/> : (<FlatList data={assignableDrivers} keyExtractor={(item) => item._id} renderItem={({ item }) => <DriverCard driver={item} isSelected={selectedDriverId === item._id} onSelect={setSelectedDriverId} requestScheduleDate={agreement.schedule.date} />} ListEmptyComponent={<Text className="text-center text-gray-500">No registered drivers with trucks available.</Text>} />)}
                        <View className="mt-auto space-y-3">
                            <TouchableOpacity onPress={() => handleAcceptanceFlow({})} disabled={isProcessing || !selectedDriverId} className={`flex-row items-center justify-center p-4 rounded-2xl ${selectedDriverId ? 'bg-green-600' : 'bg-gray-300'}`}>
                                {isProcessing && selectedDriverId ? <ActivityIndicator color="#fff"/> : <><Feather name="check" size={20} color="white" /><Text className="ml-2 text-lg font-bold text-white">Confirm & Assign</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAcceptanceFlow({ assignLater: true })} disabled={isProcessing} className="items-center justify-center p-4 bg-gray-200 rounded-2xl">
                                <Text className="text-lg font-bold text-gray-800">Assign Driver Later</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View className="flex-1 p-6">
                        <View className="items-center">
                            <View className="p-4 mb-4 bg-green-100 rounded-full"><Feather name="check-circle" size={32} color="#16A34A" /></View>
                            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Accept this Offer?</Text>
                            <Text className="mb-6 text-base text-center text-gray-600">This will finalize the agreement. This action cannot be undone.</Text>
                        </View>
                        <View className="p-5 mb-6 border border-gray-200 bg-gray-50 rounded-2xl">
                            <DetailRow icon="box" label="Material" value={request.material_id.name} />
                            <DetailRow icon="money-bill-wave" label="Final Price" value={`₹${agreement.price.toLocaleString('en-IN')} for ${agreement.quantity} ${agreement.unit.name}`} />
                        </View>
                        <View className="mt-auto space-y-3">
                            <TouchableOpacity onPress={() => handleAcceptanceFlow({})} disabled={isProcessing} className="flex-row items-center justify-center p-4 bg-green-600 rounded-2xl">
                                {isProcessing ? <ActivityIndicator color="#fff"/> : <><Feather name="check" size={20} color="white" /><Text className="ml-2 text-lg font-bold text-white">Confirm & Accept</Text></>}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleCloseAcceptSheet} className="items-center justify-center p-4 bg-gray-200 rounded-2xl">
                                <Text className="text-lg font-bold text-gray-800">Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ReusableBottomSheet>

            <ReusableBottomSheet ref={cancelBottomSheetRef} snapPoints={['70%']}>
                 <View className="flex-1 p-6">
                    <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Cancel Request</Text>
                    <Text className="mb-6 text-base text-center text-gray-600">Please provide a reason for cancellation.</Text>
                    <Text className="mb-3 text-lg font-semibold text-gray-800">Select a reason</Text>
                    <View className="flex-row flex-wrap mb-4">
                        {CANCELLATION_REASONS.map(reason => (<TouchableOpacity key={reason} onPress={() => setCancellationReason(reason)} className={`px-4 py-2 mr-2 mb-2 border rounded-full ${cancellationReason === reason ? 'bg-red-500 border-red-500' : 'bg-gray-100 border-gray-200'}`}><Text className={`font-bold ${cancellationReason === reason ? 'text-white' : 'text-gray-700'}`}>{reason}</Text></TouchableOpacity>))}
                    </View>
                    <Text className="mb-3 text-lg font-semibold text-gray-800">Or specify another reason</Text>
                    <TextInput placeholder="e.g., Project requirements have changed." value={customReason} onChangeText={setCustomReason} className="p-4 mb-6 text-base bg-gray-100 border border-gray-200 rounded-2xl h-28" textAlignVertical="top" multiline />
                    <View className="mt-auto space-y-3">
                        <TouchableOpacity onPress={handleCancelRequest} disabled={isProcessing} className="flex-row items-center justify-center p-4 bg-red-600 rounded-2xl">
                               {isProcessing ? <ActivityIndicator color="#fff"/> : <><Feather name="x-circle" size={18} color="white" /><Text className="ml-2 text-lg font-bold text-white">Confirm Cancellation</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCloseCancelSheet} className="items-center justify-center p-4 bg-gray-200 rounded-2xl">
                            <Text className="text-lg font-bold text-gray-800">Go Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ReusableBottomSheet>
            
            {/* --- UPDATED: 'Assign/Change Driver' Bottom Sheet --- */}
            <ReusableBottomSheet ref={assignDriverSheetRef} snapPoints={['85%']}>
                 <View className="flex-1 p-6">
                    <View className="items-center">
                        <View className="p-4 mb-4 bg-yellow-100 rounded-full"><FontAwesome6 name="user-check" size={28} color="#D97706" /></View>
                        <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Assign or Change Driver</Text>
                        <Text className="mb-6 text-base text-center text-gray-600">Select an available driver to start the trip.</Text>
                    </View>
                    {isLoadingDrivers ? <ActivityIndicator /> : (<FlatList data={availableDriversForChange} keyExtractor={(item) => item._id} renderItem={({ item }) => <DriverCard driver={item} isSelected={selectedDriverId === item._id} onSelect={setSelectedDriverId} requestScheduleDate={agreement.schedule.date} />} ListEmptyComponent={<Text className="text-center text-gray-500">No other registered drivers with trucks available.</Text>} />)}
                    <View className="mt-auto space-y-3">
                        <TouchableOpacity onPress={handleConfirmAssignDriver} disabled={isAssigning || !selectedDriverId} className={`flex-row items-center justify-center p-4 rounded-2xl ${selectedDriverId ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                            {isAssigning ? <ActivityIndicator color="#fff" /> : <><Feather name="check" size={20} color="white" /><Text className="ml-2 text-lg font-bold text-white">Confirm & Assign Driver</Text></>}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleCloseAssignDriverSheet} className="items-center justify-center p-4 bg-gray-200 rounded-2xl">
                            <Text className="text-lg font-bold text-gray-800">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ReusableBottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    flexOne: { flex: 1, backgroundColor: '#F9FAFB' },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
    header: { backgroundColor: 'white', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1F2937' },
    modalSubtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginTop: 8, marginBottom: 24 },
    summaryCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
    buttonContainer: { marginTop: 24, flexDirection: 'column', gap: 12 },
    button: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    sendButton: { backgroundColor: '#1F2937' },
    sendButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    cancelButton: { backgroundColor: '#E5E7EB' },
    cancelButtonText: { color: '#374151', fontSize: 18, fontWeight: 'bold' },
});

export default RequestDetailScreen;