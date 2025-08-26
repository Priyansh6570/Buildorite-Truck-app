import { View, Text, Animated } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const InProgress = ({ data, type = 'updates' }) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Get appropriate icon and message based on type
  const getTypeConfig = (type) => {
    switch (type?.toLowerCase()) {
      case 'trips':
        return {
          icon: 'car-outline',
          message: `No ${data || 'Trips'} Available`,
          subtitle: 'Check back later for new assignments',
          color: '#3b82f6'
        };
      case 'notifications':
        return {
          icon: 'notifications-outline',
          message: `No New ${data || 'Notifications'}`,
          subtitle: 'You\'re all caught up!',
          color: '#f59e0b'
        };
      case 'analytics':
      case 'reports':
        return {
          icon: 'bar-chart-outline',
          message: `No ${data || 'Analytics'} Available`,
          subtitle: 'Complete some activities to see insights',
          color: '#10b981'
        };
      case 'requests':
        return {
          icon: 'clipboard-outline',
          message: `No ${data || 'Requests'} Found`,
          subtitle: 'Create your first request to get started',
          color: '#8b5cf6'
        };
      case 'history':
        return {
          icon: 'time-outline',
          message: `No ${data || 'History'} Available`,
          subtitle: 'Your activity history will appear here',
          color: '#6b7280'
        };
      default:
        return {
          icon: 'information-circle-outline',
          message: `No ${data || 'Updates'} Available`,
          subtitle: 'Everything is up to date',
          color: '#6b7280'
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <Animated.View 
        className="items-center justify-center flex-1 px-8"
        style={{ opacity: fadeAnim }}
      >
        {/* Icon Container */}
        <View 
          className="items-center justify-center w-20 h-20 mb-6 rounded-full"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Ionicons 
            name={config.icon} 
            size={40} 
            color={config.color} 
          />
        </View>

        {/* Content */}
        <View className="items-center max-w-sm">
          <Text className="mb-3 text-xl font-semibold text-center text-gray-900">
            {config.message}
          </Text>
          <Text className="text-base leading-relaxed text-center text-gray-500">
            {config.subtitle}
          </Text>
        </View>

        {/* Simple bottom decoration */}
        <View className="flex-row mt-8 space-x-2">
          <View 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: config.color }} 
          />
          <View 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: `${config.color}60` }} 
          />
          <View 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: `${config.color}30` }} 
          />
        </View>
      </Animated.View>
    </View>
  );
};

export default InProgress;