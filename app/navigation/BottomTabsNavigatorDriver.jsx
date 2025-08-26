import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import DriverProfileScreen from '../screens/home/DriverProfileScreen';
import DriverHomeScreen from '../screens/home/DriverHomeScreen.jsx';
import TripsScreen from '../screens/profile/TripsScreen.jsx';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View, Animated, TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useNotification } from '../context/NotificationContext.jsx';
import { useUpdatePushToken } from '../hooks/useUser.js';
import { useCheckUser } from "../hooks/useAuth.js";
import { useUnreadCount } from "../hooks/useNotification";

const Tab = createBottomTabNavigator();

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation, unreadCount }) => {
  return (
    <View style={{
      backgroundColor: 'white',
      height: 67,
      borderTopWidth: 0.5,
      borderTopColor: '#e5e7eb',
      elevation: 0,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      paddingTop: 8,
      paddingBottom: 0,
      paddingHorizontal: 10,
      flexDirection: 'row',
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <AnimatedTabButton
            key={route.key}
            onPress={onPress}
            isFocused={isFocused}
            routeName={route.name}
            label={label}
            unreadCount={route.name === "Activity" ? unreadCount : 0}
          />
        );
      })}
    </View>
  );
};

// Animated Tab Button Component
const AnimatedTabButton = ({ onPress, isFocused, routeName, label, unreadCount }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const iconScaleValue = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  const gradientOpacityValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScaleValue, {
        toValue: isFocused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 30,
        friction: 100,
      }),
      Animated.timing(gradientOpacityValue, {
        toValue: isFocused ? 1 : 0,
        duration: 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getIconComponent = () => {
    let iconName;
    let IconComponent;
    const iconSize = 18;

    switch (routeName) {
      case 'Home':
        IconComponent = FontAwesome6;
        iconName = 'house';
        break;
      case 'Trips':
        IconComponent = FontAwesome6;
        iconName = 'route';
        break;
      case 'Activity':
        IconComponent = Ionicons;
        iconName = 'notifications';
        break;
      case 'Profile':
        IconComponent = Ionicons;
        iconName = 'person';
        break;
      default:
        return null;
    }

    return (
      <Animated.View
        style={{
          transform: [{ scale: iconScaleValue }],
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Gradient Background */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -8,
            left: -7,
            opacity: gradientOpacityValue,
            borderRadius: 8,
          }}
        >
          <LinearGradient
            colors={['#212B39', '#4A5462']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 35,
              height: 35,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <IconComponent name={iconName} size={iconSize - 3} color="white" />
          </LinearGradient>
        </Animated.View>

        {/* Regular Icon */}
        <Animated.View
          style={{
            opacity: gradientOpacityValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          <IconComponent
            name={iconName}
            size={iconSize + 3}
            color={isFocused ? '#000' : '#9ca3af'}
          />
        </Animated.View>

        {/* Unread Badge */}
        {routeName === "Activity" && unreadCount > 0 && (
          <View
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              backgroundColor: "red",
              borderRadius: 10,
              paddingHorizontal: 5,
              minWidth: 18,
              height: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>
              {unreadCount}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View style={{ marginBottom: 4 }}>
          {getIconComponent()}
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: isFocused ? '#000' : '#9ca3af',
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const BottomTabsNavigatorDriver = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { expoPushToken } = useNotification();
  const { mutate: updatePushToken } = useUpdatePushToken();
  const checkUserMutation = useCheckUser();

  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    if (expoPushToken && user && user.email) {
      updatePushToken({ pushToken: expoPushToken });
    }
  }, [expoPushToken, user]);

  useEffect(() => {
    if (!user || !user.email) {
      console.warn("User is not authenticated or email is missing.", user);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  }, [user]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} unreadCount={unreadCount} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={DriverHomeScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Activity" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigatorDriver;