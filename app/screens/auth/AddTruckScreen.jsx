import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator, 
    BackHandler,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Animated,
    StyleSheet
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAddTruck } from '../../hooks/useTruck';
import Toast from 'react-native-toast-message';
import * as Location from 'expo-location';
import { FontAwesome5, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddTruckScreen = () => {
    // --- HOOKS & STATE ---
    const navigation = useNavigation();
    const insets = useSafeAreaInsets(); // For safe area positioning
    const { mutate: addTruck, isLoading: isAddingTruck } = useAddTruck();
    const [name, setName] = useState('');
    const [registrationNumber, setRegistrationNumber] = useState('');
    const [location, setLocation] = useState(null);
    const [locationErrorMsg, setLocationErrorMsg] = useState(null);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [isRequestingPermission, setIsRequestingPermission] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    
    // Input focus and error state
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isRegistrationFocused, setIsRegistrationFocused] = useState(false);
    const [registrationNumberError, setRegistrationNumberError] = useState(null);


    // --- ANIMATION ---
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        if (isLocationLoading && !locationErrorMsg) {
            animation.start();
        } else {
            animation.stop();
        }
        return () => animation.stop();
    }, [isLocationLoading, locationErrorMsg]);

    useEffect(() => {
        getLocation();
    }, []);

    const getLocation = async () => {
        setIsLocationLoading(true);
        setIsRequestingPermission(true);
        setLocationErrorMsg(null);
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
            setLocationErrorMsg('Location permission is needed to proceed.');
            setIsLocationLoading(false);
            setIsRequestingPermission(false);
            return;
        }
        try {
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation.coords);
            setLocationErrorMsg(null);
        } catch (err) {
            setLocationErrorMsg('Failed to get location. Please ensure location services are enabled.');
            setLocation(null);
        } finally {
            setIsLocationLoading(false);
            setIsRequestingPermission(false);
        }
    };

    const validateRegistrationNumber = (number) => {
        if (!number.trim()) return null;
        const pattern1 = /^[A-Z]{2}[ -]{0,1}[0-9]{2}[ -]{0,1}[A-Z]{1,2}[ -]{0,1}[0-9]{4}$/;
        const pattern2 = /^[0-9]{2}[ -]{0,1}BH[ -]{0,1}[0-9]{4}[ -]{0,1}[A-Z]{1,2}$/;
        
        if (!pattern1.test(number.toUpperCase()) && !pattern2.test(number.toUpperCase())) {
            return 'Invalid registration number format.';
        }
        return null;
    };
    
    const handleRegistrationNumberBlur = () => {
        const error = validateRegistrationNumber(registrationNumber);
        setRegistrationNumberError(error);
    };

    const isButtonDisabled = isAddingTruck || !name.trim() || !registrationNumber.trim() || !location || !!validateRegistrationNumber(registrationNumber);

    const handleAddTruck = () => {
        if(isAddingTruck) return;
        if (isButtonDisabled) return;
        setIsAdding(true);

        const current_location = {
            lat: location.latitude,
            long: location.longitude,
        };

        addTruck(
            { name: name.trim(), registration_number: registrationNumber.trim().toUpperCase().replace(/\s/g, ''), current_location },
            {
                onSuccess: () => {
                    Toast.show({
                        type: 'success',
                        text1: 'Success',
                        text2: 'Truck added successfully!',
                    });
                    navigation.reset({ index: 0, routes: [{ name: 'DBNav' }] });
                },
                onError: (err) => {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: err?.response?.data?.message || 'Failed to add truck.',
                    });
                },
                onSettled: () => {
                    setIsAdding(false);
                },
            }
        );
    };

    // --- UI COMPONENTS ---
    const SecureAuthSection = () => (
        <View className="my-6 overflow-hidden border-2 shadow-sm rounded-2xl border-slate-100">
            <LinearGradient colors={["#F0FDF4", "#f0f9ff"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} className="flex-row items-center p-6">
                <View className="mr-4 overflow-hidden shadow-sm rounded-xl">
                    <LinearGradient colors={["#21C25C", "#17A54B"]} className="items-center justify-center w-16 h-16">
                        <FontAwesome5 name="lock" size={20} color="white" />
                    </LinearGradient>
                </View>
                <View>
                    <Text className="text-xl font-bold text-gray-900">Secure Registration</Text>
                    <Text className="text-gray-600 text-md">Your vehicle data is safe</Text>
                </View>
            </LinearGradient>
        </View>
    );
    
    const LocationStatusDisplay = () => {
        if (isLocationLoading) {
            return (
                <View className="flex-row items-center p-4 mt-2 bg-[#F9FAFB] border rounded-2xl border-slate-200">
                    <Animated.View style={{ opacity: pulseAnim }}>
                        <View className="overflow-hidden shadow-sm rounded-xl">
                            <LinearGradient colors={["#3579F3", "#3A6FF1"]} className="items-center justify-center w-12 h-12">
                                <Ionicons name="location" size={24} color="white" />
                            </LinearGradient>
                        </View>
                    </Animated.View>
                    <Text className="ml-4 text-base font-semibold text-gray-500">Fetching location...</Text>
                </View>
            );
        }
    
        if (locationErrorMsg) {
            return (
                <View className="p-6 mt-2 bg-[#FFF7ED] border rounded-2xl border-[#FEDEBA]">
                    <View className="flex-row items-center">
                        <View className="overflow-hidden shadow-sm rounded-xl">
                            <LinearGradient colors={["#F97316", "#EA580C"]} className="items-center justify-center w-12 h-12">
                                <FontAwesome6 name="location-crosshairs" size={22} color="white" />
                            </LinearGradient>
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-lg font-bold text-gray-900">Location Permission Required</Text>
                            <Text className="text-gray-600 text-md">{locationErrorMsg}</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={getLocation} disabled={isRequestingPermission} className="flex-row items-center justify-center p-4 mt-4 bg-orange-500 rounded-2xl">
                        {isRequestingPermission ? <ActivityIndicator color="white" /> : 
                            <>
                                <FontAwesome6 name="location-arrow" size={16} color="white" className="mr-2" />
                                <Text className="text-lg font-bold text-white">Enable Location Access</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            );
        }
    
        if (location) {
            return (
                <View className="p-6 mt-2 bg-[#F0FDF4] border rounded-2xl border-[#A7F3D0]">
                    <View className="flex-row items-center">
                        <View className="overflow-hidden shadow-sm rounded-xl">
                            <LinearGradient colors={["#10B981", "#059669"]} className="items-center justify-center w-12 h-12">
                                <FontAwesome6 name="check" size={22} color="white" />
                            </LinearGradient>
                        </View>
                        <View className="flex-1 ml-4">
                            <Text className="text-lg font-bold text-gray-900">Location Acquired</Text>
                            <Text className="text-green-700 text-md">Your current location has been detected</Text>
                        </View>
                    </View>
                </View>
            );
        }
    
        return null;
    };
    

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#1C2533]">
            
            <TouchableOpacity
                onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })}
                activeOpacity={0.7}
                style={[styles.loginButton, { top: insets.top + 15 }]}
            >
                <View style={styles.loginButtonContainer}>
                    <MaterialIcons name="keyboard-arrow-left" size={24} color="white" />
                    <Text style={styles.loginButtonText}>Login</Text>
                </View>
            </TouchableOpacity>

            <LinearGradient colors={["#172033", "#1C2533"]} className="h-[30%] items-center justify-center" style={{ minHeight: 250 }}>
                <StatusBar barStyle="light-content" backgroundColor="#172033" />
                <View className="items-center justify-center w-24 h-24 mb-4 overflow-hidden rounded-3xl">
                    <LinearGradient colors={['#10B981', '#059669']} className="items-center justify-center w-full h-full">
                        <FontAwesome5 name="truck" size={40} color="white" />
                    </LinearGradient>
                </View>
                <Text className="text-4xl font-bold text-white">Add Your Truck</Text>
                <Text className="mt-1 text-lg font-semibold text-gray-200">Register your vehicle to start trips</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View className="flex-1 p-6 bg-white rounded-t-3xl ">
                    <View className="p-8 bg-white border rounded-3xl border-slate-100" style={{ elevation: 5, shadowColor: "#00000050" }}>
                        
                        {/* Truck Name Input */}
                        <Text className="mb-2 font-semibold text-gray-800">Truck Name</Text>
                        <View className={`flex-row p-3 max-h-20 items-center bg-white border rounded-2xl ${isNameFocused ? "border-blue-500 border-2" : "border-slate-200"}`}>
                            <View className="overflow-hidden rounded-lg">
                                <LinearGradient colors={["#10B981", "#059669"]} className="items-center justify-center p-3">
                                    <FontAwesome5 name="truck" size={16} color="white" />
                                </LinearGradient>
                            </View>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter truck name or model"
                                placeholderTextColor="#9CA3AF"
                                className="flex-1 p-3 text-lg font-semibold text-gray-800"
                                onFocus={() => setIsNameFocused(true)}
                                onBlur={() => setIsNameFocused(false)}
                                returnKeyType="next"
                            />
                        </View>

                        {/* Registration Number Input */}
                        <Text className="mt-6 mb-2 font-semibold text-gray-800">Registration Number</Text>
                        <View className={`flex-row p-3 max-h-20 items-center bg-white border rounded-2xl ${isRegistrationFocused ? "border-blue-500 border-2" : registrationNumberError ? "border-red-500" : "border-slate-200"}`}>
                             <View className="overflow-hidden rounded-lg shadow-sm">
                                <LinearGradient colors={["#F59E0B", "#D97706"]} className="items-center justify-center p-3">
                                    <FontAwesome5 name="id-card" size={16} color="white" />
                                </LinearGradient>
                            </View>
                            <TextInput
                                value={registrationNumber}
                                onChangeText={(text) => {
                                    setRegistrationNumber(text);
                                    if (registrationNumberError) {
                                        setRegistrationNumberError(null);
                                    }
                                }}
                                placeholder="e.g., MP09XY1234"
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                                className="flex-1 p-3 text-lg font-semibold text-gray-800"
                                onFocus={() => setIsRegistrationFocused(true)}
                                onBlur={handleRegistrationNumberBlur}
                                returnKeyType="done"
                            />
                        </View>
                        {registrationNumberError && <Text className="mt-2 text-red-500">{registrationNumberError}</Text>}

                        
                        {/* Location Section */}
                        <Text className="mt-6 mb-2 font-semibold text-gray-800">Current Location</Text>
                        <LocationStatusDisplay />

                        {/* Add Truck Button */}
                        <TouchableOpacity onPress={handleAddTruck} disabled={isButtonDisabled} className={`mt-8 p-5 rounded-2xl items-center justify-center ${isButtonDisabled ? 'bg-gray-400' : 'bg-[#1C2533]'}`} style={{ elevation: 3, shadowColor: "#000" }}>
                            {isAdding ? <ActivityIndicator color="#fff" /> : <Text className="text-xl font-bold text-white">Add Truck</Text>}
                        </TouchableOpacity>
                    </View>
                    
                    <SecureAuthSection />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    loginButton: {
        position: 'absolute',
        left: 10,
        zIndex: 10,
    },
    loginButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 999,
        paddingVertical: 6,
        paddingLeft: 10,
        paddingRight: 20,
    },
    loginButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 16,
    }
});

export default AddTruckScreen;