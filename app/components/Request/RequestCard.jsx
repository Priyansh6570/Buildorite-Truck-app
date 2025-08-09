import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome6 } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedIndicator = ({ color }) => {
    const opacityAnim = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 0.3, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        ).start();
    }, [opacityAnim]);
    return <Animated.View style={{ opacity: opacityAnim }} className={`w-3 h-3 ${color} rounded-full mr-2`} />;
};

const ActionBadge = ({ colors, icon, text }) => (
    <View className="overflow-hidden rounded-full">
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center px-4 py-2">
            <FontAwesome6 name={icon} size={12} color="white" solid />
            <Text className="ml-1 font-extrabold text-white text-md">{text}</Text>
        </LinearGradient>
    </View>
);

const RequestCard = ({ request, userType }) => {
    const navigation = useNavigation();
    const isArchived = ['completed', 'rejected', 'canceled'].includes(request.status);
    const isPickup = request.current_proposal.delivery_method === 'pickup';

    // **CHANGE**: Determine if it's the current user's turn to take action
    const isMyTurn = (userType === 'seller' && request.last_updated_by === 'buyer') ||
                   (userType === 'buyer' && request.last_updated_by === 'seller');

    const topSectionStyle = {
        bgColor: isPickup ? 'bg-blue-50' : 'bg-green-50',
        gradientColors: isPickup ? ['#3F75F2', '#4B53E9'] : ['#1BB961', '#0A9E67'],
        iconName: isPickup ? 'truck' : 'truck-fast',
        iconSize: isPickup ? 12 : 13,
        text: isPickup ? 'PICKUP' : 'DELIVERY',
        textColor: isPickup ? 'text-blue-700' : 'text-green-700'
    };

    const weightIconGradientColors = isArchived
        ? ['#d1d5db', '#9ca3af']
        : isPickup
            ? ['#38BDF8', '#3F75F2']
            : ['#86EFAC', '#22C55E'];

    // **CHANGE**: Render status footer based on perspective
    const renderStatusFooter = () => {
        switch (request.status) {
            case 'pending':
            case 'countered':
                if (isMyTurn) {
                    return (
                        <View className="flex-row items-center justify-between flex-1 p-1">
                            <View className="flex-row items-center">
                                <AnimatedIndicator color="bg-green-500" />
                                <Text className="font-semibold text-gray-600 text-md">
                                    {request.status === 'pending' ? 'New Request' : 'New Response'}
                                </Text>
                            </View>
                            <ActionBadge colors={['#1EBE60', '#069869']} icon="eye" text="View" />
                        </View>
                    );
                } else {
                    return (
                        <View className="flex-row items-center p-2">
                            <View className="w-3 h-3 mr-2 bg-blue-500 rounded-full" />
                            <Text className="font-semibold text-gray-600 text-md">Awaiting Response</Text>
                        </View>
                    );
                }
            
            case 'accepted':
                 return (
                    <View className="flex-row items-center justify-between flex-1 p-1">
                        <View className="flex-row items-center">
                            <FontAwesome6 name="check-double" size={14} color="#16a34a" />
                            <Text className="ml-2 font-semibold text-gray-600 text-md">Agreement Finalized</Text>
                        </View>
                        <ActionBadge colors={['#1EBE60', '#069869']} icon="eye" text="View" />
                    </View>
                );

            case 'in_progress':
                return (
                    <View className="flex-row items-center justify-between flex-1 p-1">
                        <View className="flex-row items-center">
                             <AnimatedIndicator color="bg-orange-500" />
                            <Text className="font-semibold text-gray-600 text-md">En Route</Text>
                        </View>
                        <ActionBadge colors={['#F76D17', '#DD2925']} icon="location-dot" text="Track" />
                    </View>
                );
            case 'completed':
                return (
                    <View className="flex-row items-center self-start px-4 py-3 bg-gray-100 rounded-full">
                        <FontAwesome6 name="circle-check" size={14} color="#52525b" />
                        <Text className="ml-2 text-sm font-medium text-zinc-600">Completed</Text>
                    </View>
                );
            case 'rejected':
                return (
                    <View className="flex-row items-center self-start px-4 py-3 bg-red-100 rounded-full">
                        <FontAwesome6 name="circle-xmark" size={14} color="#dc2626" />
                        <Text className="ml-2 text-sm font-medium text-red-600">Rejected</Text>
                    </View>
                );
            case 'canceled':
               return (
                    <View className="flex-row items-center self-start px-4 py-3 bg-red-100 rounded-full">
                        <FontAwesome6 name="ban" size={14} color="#dc2626" />
                        <Text className="ml-2 text-sm font-medium text-red-600">Canceled</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('RequestDetailScreen', { requestId: request._id, userType: userType })}
            className="mb-6 bg-white border shadow-sm rounded-3xl border-slate-200"
        >
            {/* --- Top Section --- */}
            <View className={`flex-row items-center justify-between p-4 ${topSectionStyle.bgColor} rounded-t-2xl`}>
                <View className="flex-row items-center">
                    <View className="overflow-hidden rounded-full">
                        <LinearGradient colors={topSectionStyle.gradientColors} className="items-center justify-center p-2.5">
                            <FontAwesome6 name={topSectionStyle.iconName} size={topSectionStyle.iconSize} color="white" />
                        </LinearGradient>
                    </View>
                    <Text className={`ml-3 text-md font-bold tracking-wider uppercase ${topSectionStyle.textColor}`}>
                        {topSectionStyle.text}
                    </Text>
                </View>
                <Text className="text-sm font-semibold text-gray-500">
                    {formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}
                </Text>
            </View>

            {/* --- Main Content --- */}
            <View className="p-6">
                <View>
                    {/* **CHANGE**: Show Truck Owner's name for the Mine Owner's view */}
                    <Text className="text-xl font-bold text-gray-900 capitalize" numberOfLines={1}>{request.mine_id.name}</Text>
                    <Text className="text-lg font-semibold text-gray-600" numberOfLines={1}>{request.material_id.name}</Text>
                </View>

                <View className="flex-row items-center mt-4">
                    <View className="overflow-hidden rounded-2xl">
                         <LinearGradient colors={weightIconGradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="items-center justify-center p-4">
                            <FontAwesome6 name="weight-hanging" size={20} color="white" />
                        </LinearGradient>
                    </View>
                    <View className="ml-4">
                        <Text className="text-2xl font-bold text-gray-800">
                            {request.current_proposal.quantity} {request.current_proposal.unit.name}
                        </Text>
                        <Text className={`text-xl ml-1 font-semibold ${isArchived ? 'text-gray-500' : 'text-green-600'}`}>
                            ₹{request.current_proposal.price.toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- Footer Status --- */}
            <View className="px-4 py-4 mt-2 border-t border-slate-100">
                {renderStatusFooter()}
            </View>
        </TouchableOpacity>
    );
};

export default RequestCard;