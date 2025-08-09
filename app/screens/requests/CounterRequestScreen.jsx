import React, { useState, useMemo, useRef, useEffect } from "react";
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    ActivityIndicator, Platform, Modal, StyleSheet
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
    MaterialIcons, FontAwesome, FontAwesome6, Feather,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { format } from 'date-fns';
import { useSubmitProposal } from "../../hooks/useRequest";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import DatePicker from "react-native-date-picker";
import DocumentUploader from "../../components/Ui/DocumentUploader";

// --- Helper Components ---

const UnitDropdown = ({ units, onSelect, selectedUnitId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedUnit = units.find((u) => u._id === selectedUnitId);

    return (
        <View>
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsOpen(!isOpen)}
                className="flex-row items-center justify-between w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50"
            >
                <Text className="text-xl text-gray-800">
                    {selectedUnit ? selectedUnit.name : "Select a Unit"}
                </Text>
                <MaterialIcons name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color="#9CA3AF" />
            </TouchableOpacity>
            {isOpen && (
                <View className="absolute z-50 w-full bg-white border border-gray-200 shadow-lg top-full rounded-xl max-h-48">
                    <ScrollView nestedScrollEnabled={true}>
                        {units.map((unit) => (
                            <TouchableOpacity
                                key={unit._id}
                                onPress={() => { onSelect(unit._id); setIsOpen(false); }}
                                className="p-4 border-b border-gray-100"
                            >
                                <Text className="text-base">{unit.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

// --- Main Component ---

const CounterRequestScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { request } = route.params;

    // State for the form
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unitId, setUnitId] = useState("");
    const [deliveryCharge, setDeliveryCharge] = useState("");
    const [schedule, setSchedule] = useState(null);
    const [comments, setComments] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for validation and confirmation modal
    const [formErrors, setFormErrors] = useState({});
    const [isModalVisible, setModalVisible] = useState(false);

    const scheduleSheetRef = useRef(null);
    const [tempDate, setTempDate] = useState(new Date());

    const { mutate: submitProposal, isLoading } = useSubmitProposal();

    // Pre-fill form once on mount
    useEffect(() => {
        if (request?.current_proposal) {
            const { current_proposal } = request;
            setPrice(current_proposal.price.toString());
            setQuantity(current_proposal.quantity.toString());
            setUnitId(current_proposal.unit._id);
            setDeliveryCharge(current_proposal.delivery_charge?.toString() || "0");
            if (current_proposal.schedule?.date) {
                const scheduleDate = new Date(current_proposal.schedule.date);
                setSchedule(scheduleDate);
                setTempDate(scheduleDate);
            }
        }
    }, []);

    const availableUnits = useMemo(() => {
        if (!request?.material_id?.prices) return [];
        return request.material_id.prices.map((priceInfo) => priceInfo.unit).filter(Boolean);
    }, [request?.material_id]);

    const validateForm = () => {
        const errors = {};
        if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            errors.price = 'Please enter a valid price.';
        }
        if (!quantity.trim() || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
            errors.quantity = 'Please enter a valid quantity.';
        }
        if (!unitId) {
            errors.unitId = 'Please select a unit.';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleOpenConfirmation = () => {
        if (validateForm()) {
            setModalVisible(true);
        } else {
             Toast.show({ type: "error", text1: "Validation Error", text2: "Please check the form for errors." });
        }
    };

    const handleConfirmSend = () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        const proposalData = {
            delivery_method: request.current_proposal.delivery_method,
            delivery_location: request.current_proposal.delivery_location,
            unit: unitId,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            delivery_charge: parseFloat(deliveryCharge || 0),
            schedule: { date: schedule },
            comments,
            attachments,
        };

        submitProposal({ requestId: request._id, proposal: proposalData }, {
            onSuccess: () => {
                setModalVisible(false);
                Toast.show({ type: "success", text1: "Counter-Offer Sent!" });
                navigation.goBack();
            },
            onError: (error) => {
                setModalVisible(false);
                Toast.show({ type: "error", text1: "Submission Failed", text2: error.message || "Please try again." });
            },
            onSettled: () => {
                setIsSubmitting(false);
            }
        });
    };

    const openScheduleSheet = () => scheduleSheetRef.current?.snapToIndex(0);
    const closeScheduleSheet = () => scheduleSheetRef.current?.close();
    const handleScheduleConfirm = () => {
        setSchedule(tempDate);
        closeScheduleSheet();
    };
    
    const selectedUnitName = useMemo(() => availableUnits.find(u => u._id === unitId)?.name || '', [unitId, availableUnits]);

    return (
        <View className="flex-1 bg-white">
            <View className="bg-gray-900" style={{ paddingTop: insets.top }}>
                <View className="flex-row items-center justify-center px-8 py-8">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="absolute left-8 p-3 py-5 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
                        <Feather name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-white">Counter Offer</Text>
                </View>
            </View>

            <View className="flex-1 bg-slate-100">
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom }} className="flex-1 p-4">
                    
                    <View className="p-6 py-8 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
                        <View className="flex-row items-start mb-8">
                            <View className="mr-4 overflow-hidden rounded-2xl">
                                <LinearGradient colors={["#60a5fa", "#3b82f6"]} className="p-4"><FontAwesome6 name="file-invoice-dollar" size={20} color="#ffffff" /></LinearGradient>
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">Proposal Terms</Text>
                                <Text className="text-base text-gray-500">Adjust the quantity, price, and unit</Text>
                            </View>
                        </View>
                        
                        <Text className="mb-2 text-base font-semibold text-gray-700">Unit</Text>
                        <UnitDropdown units={availableUnits} onSelect={(id) => { setUnitId(id); setFormErrors(p => ({...p, unitId: null})) }} selectedUnitId={unitId} />
                        {formErrors.unitId && <Text className="mt-2 text-red-600">{formErrors.unitId}</Text>}

                        <Text className="mt-6 mb-2 text-base font-semibold text-gray-700">Quantity</Text>
                        <TextInput value={quantity} onChangeText={(text) => { setQuantity(text); setFormErrors(p => ({...p, quantity: null})) }} placeholder="Enter quantity" keyboardType="numeric" className={`w-full h-[68px] p-4 px-6 text-xl font-bold text-gray-900 border ${formErrors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-xl bg-gray-50`} />
                        {formErrors.quantity && <Text className="mt-2 text-red-600">{formErrors.quantity}</Text>}
                        
                        <Text className="mt-6 mb-2 text-base font-semibold text-gray-700">Price per Unit</Text>
                        <TextInput value={price} onChangeText={(text) => { setPrice(text); setFormErrors(p => ({...p, price: null})) }} placeholder="Enter price" keyboardType="numeric" className={`w-full h-[68px] p-4 px-6 text-xl font-bold text-gray-900 border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-xl bg-gray-50`} />
                        {formErrors.price && <Text className="mt-2 text-red-600">{formErrors.price}</Text>}

                         {request.current_proposal.delivery_method === "delivery" && (
                             <>
                                <Text className="mt-6 mb-2 text-base font-semibold text-gray-700">Delivery Charge (Optional)</Text>
                                <TextInput value={deliveryCharge} onChangeText={setDeliveryCharge} placeholder="Enter delivery charge" keyboardType="numeric" className="w-full h-[68px] p-4 px-6 text-xl font-bold text-gray-900 border border-gray-300 rounded-xl bg-gray-50"/>
                            </>
                         )}
                    </View>

                    <View className="p-6 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
                        <View className="flex-row items-start mb-6">
                            <View className="mr-4 overflow-hidden rounded-2xl"><LinearGradient colors={["#2dd4bf", "#14b8a6"]} className="p-4"><MaterialIcons name="event-available" size={20} color="#ffffff" /></LinearGradient></View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">Schedule</Text>
                                <Text className="text-base text-gray-500">Select your preferred date</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={openScheduleSheet} className="flex-row items-center justify-between w-full h-[68px] p-4 px-6 text-gray-700 border border-gray-300 rounded-xl bg-gray-50">
                            <Text className="text-xl text-gray-800">{schedule ? new Date(schedule).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Select a date"}</Text>
                            <MaterialIcons name="calendar-today" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View className="p-6 mb-4 bg-white border shadow-sm rounded-3xl border-slate-100">
                         <View className="flex-row items-start mb-6">
                            <View className="mr-4 overflow-hidden rounded-2xl"><LinearGradient colors={["#a78bfa", "#8b5cf6"]} className="p-4"><MaterialIcons name="more-horiz" size={20} color="#ffffff" /></LinearGradient></View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-gray-900">Optional Details</Text>
                                <Text className="text-base text-gray-500">Add comments or files if needed</Text>
                            </View>
                        </View>
                        <Text className="mb-2 text-base font-semibold text-gray-700">Comments</Text>
                        <TextInput value={comments} onChangeText={setComments} placeholder="Add any specific details..." multiline className="h-32 p-4 px-6 text-xl border border-gray-300 bg-gray-50 rounded-xl" textAlignVertical="top"/>
                        <Text className="mt-4 mb-2 text-base font-semibold text-gray-700">Attachments</Text>
                        <DocumentUploader onUpload={(files) => setAttachments(files)} />
                    </View>

                    <TouchableOpacity activeOpacity={0.8} onPress={handleOpenConfirmation} disabled={isLoading} className="flex-row items-center justify-center p-5 mt-6 bg-gray-800 mb-14 rounded-2xl">
                        {isLoading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <FontAwesome name="send" size={18} color="white" />
                                <Text className="ml-3 text-xl font-bold text-white">Send Counter-Offer</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    {/* --- Confirmation Modal --- */}
            <Modal transparent={true} visible={isModalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Confirm Your Offer</Text>
                        <Text style={styles.modalSubtitle}>Please review the details before sending.</Text>
                        
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>{request.material_id.name}</Text>
                            <View style={styles.priceLine}>
                                <Text style={styles.priceText}>₹{parseFloat(price).toLocaleString('en-IN')}</Text>
                                <Text style={styles.quantityText}> for {quantity} {selectedUnitName}</Text>
                            </View>
                            <View style={styles.separator} />
                            <View style={styles.detailRow}>
                                <FontAwesome6 name="calendar-alt" size={16} color="#4B5563" />
                                <Text style={styles.detailText}>{schedule ? format(schedule, "MMM d, yyyy") : 'Not set'}</Text>
                            </View>
                             {comments.trim() && (
                                <View style={styles.detailRow}>
                                    <FontAwesome6 name="comment-dots" size={16} color="#4B5563" />
                                    <Text style={styles.detailText} numberOfLines={2}>{comments}</Text>
                                </View>
                            )}
                            {attachments.length > 0 && (
                                <View style={styles.detailRow}>
                                    <FontAwesome6 name="paperclip" size={16} color="#4B5563" />
                                    <Text style={styles.detailText}>{attachments.length} file(s) attached</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonContainer}>
                             <TouchableOpacity onPress={handleConfirmSend} disabled={isLoading} style={[styles.button, styles.sendButton]}>
                                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send Offer</Text>}
                            </TouchableOpacity>
                             <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.button, styles.cancelButton]}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
                </ScrollView>
            </View>

            

            <ReusableBottomSheet ref={scheduleSheetRef} snapPoints={["65%"]}>
                <View className="flex-1 p-6"><View className="items-center mb-8"><View className="p-4 mb-6 bg-gray-100 rounded-full"><MaterialIcons name="calendar-today" size={28} color="#374151" /></View><Text className="mb-3 text-2xl font-bold text-center text-gray-900">Select Preferred Date</Text></View><View className="items-center justify-center flex-1 mb-8"><DatePicker date={tempDate} onDateChange={setTempDate} mode="date" minimumDate={new Date()} style={{ alignSelf: "center" }} theme="light"/></View><View className="gap-4 mt-auto"><TouchableOpacity onPress={handleScheduleConfirm} className="p-4 bg-gray-800 rounded-2xl"><Text className="text-lg font-bold text-center text-white">Set Date</Text></TouchableOpacity><TouchableOpacity onPress={closeScheduleSheet} className="p-4 bg-gray-100 rounded-2xl"><Text className="text-lg font-bold text-center text-gray-700">Cancel</Text></TouchableOpacity></View></View>
            </ReusableBottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContainer: { width: '90%', backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1F2937' },
    modalSubtitle: { fontSize: 16, textAlign: 'center', color: '#6B7280', marginTop: 8, marginBottom: 24 },
    summaryCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#F3F4F6' },
    summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    priceLine: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
    priceText: { fontSize: 28, fontWeight: 'bold', color: '#16A34A' },
    quantityText: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginLeft: 8 },
    separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    detailText: { fontSize: 16, color: '#374151', marginLeft: 12, flex: 1 },
    buttonContainer: { marginTop: 24, flexDirection: 'column', gap: 12 },
    button: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    sendButton: { backgroundColor: '#1F2937' },
    sendButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    cancelButton: { backgroundColor: '#E5E7EB' },
    cancelButtonText: { color: '#374151', fontSize: 18, fontWeight: 'bold' },
});

export default CounterRequestScreen;