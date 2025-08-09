import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import DriverHomeScreen from '../screens/home/DriverHomeScreen.jsx';
import TripsScreen from '../screens/profile/TripsScreen.jsx';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';
import { useCheckUser } from "../hooks/useAuth.js";
import { useNotification } from '../context/NotificationContext.jsx';
import { useUpdatePushToken } from '../hooks/useUser.js';

const Tab = createBottomTabNavigator();

const BottomTabsNavigator = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { expoPushToken } = useNotification();
  const { mutate: updatePushToken } = useUpdatePushToken();
  const checkUserMutation = useCheckUser();

  useEffect(() => {
    if (expoPushToken && user && user.email) {
      updatePushToken({pushToken : expoPushToken});
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          height: 60,
          borderTopWidth: 0.5,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIcon: ({ color, size }) => {
          switch (route.name) {
            case 'Home':
              return <AntDesign name="home" size={size} color={color} />;
            case 'Trips':
              return <Entypo name="circular-graph" size={size} color={color} />;
            case 'Activity':
              return <Entypo name="notification" size={size} color={color} />;
            case 'Profile':
              return <FontAwesome name="user-o" size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={DriverHomeScreen} />
      <Tab.Screen name="Trips" component={TripsScreen} />
      <Tab.Screen name="Activity" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;