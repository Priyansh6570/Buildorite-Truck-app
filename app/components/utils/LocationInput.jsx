import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    Image,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const LocationInput = ({ onLocationSelect }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');

    const handleLocationSelect = (data, details) => {
        if (details) {
            const location = {
                address: data.description,
                coordinates: [
                    details.geometry.location.lng,
                    details.geometry.location.lat,
                ],
            };
            setSelectedLocation(data.description);
            onLocationSelect(location);
            setModalVisible(false);
        }
    };

    return (
        <View className="mb-5">
            {/* <Text className="mb-2 text-lg font-bold text-black">Mine Location</Text> */}

            <TouchableOpacity
                onPress={() => {
          setTimeout(() => setModalVisible(true), 10);
        }}
                className="p-4 mb-5 text-black bg-white rounded-lg shadow-md"
            >
                <Text className={selectedLocation ? 'text-black' : 'text-gray-400'}>
                    {selectedLocation || 'Enter mine location'}
                </Text>
            </TouchableOpacity>

            <Modal animationType="fade" visible={modalVisible}>
                <View className="flex-1 p-5">
                    <View className="flex flex-row items-center justify-center w-full py-4 mb-4 rounded-xl h-fit bg-slate-100">
                        <Text className="p-2 text-2xl font-bold text-center text-black rounded-lg bg-slate-100">Select Mine location</Text>
                    </View>

                    <Image
                        source={require('../../../assets/icons/pin.jpg')}
                        className="absolute self-center justify-center w-16 h-16 mx-auto top-[50%] scale-[4]"
                    />

                    <GooglePlacesAutocomplete
                        placeholder="Type a location"
                        minLength={2}
                        fetchDetails={true}
                        debounce={500}
                        enablePoweredByContainer={false}
                        onPress={(data, details = null) => {
                            handleLocationSelect(data, details);
                          }}
                        query={{
                            key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
                            language: 'en',
                            components: 'country:IN',
                        }}
                        styles={{
                            textInputContainer: { width: '100%' },
                            textInput: {
                                padding: 12,
                                borderColor: '#ddd',
                                borderWidth: 1,
                                borderRadius: 8,
                                fontSize: 16,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                            },
                            row: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 10,
                                borderBottomWidth: 1,
                                width: '100%',
                                borderColor: '#ddd',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.25,
                            },
                            description: { fontWeight: 'bold', fontSize: 16 },
                            secondaryText: { color: '#666', fontSize: 14 },
                        }}
                        renderRow={(data) => (
                            <View className="flex-row items-center w-full gap-3 p-3">
                                <Image
                                    source={require('../../../assets/icons/location.png')}
                                    className="w-6 h-6"
                                />
                                <View>
                                    <Text className="text-base font-bold text-black">
                                        {data.structured_formatting.main_text}
                                    </Text>
                                    <Text className="text-sm text-gray-500">
                                        {data.structured_formatting.secondary_text}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />

                    <TouchableOpacity
                        className="p-4 mt-5 bg-black rounded-lg"
                        onPress={() => setModalVisible(false)}
                    >
                        <Text className="font-bold text-center text-white">Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

export default LocationInput;