import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/home/HomeScreen.jsx';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import RequestsScreen from '../screens/home/RequestsScreen';
import ProfileScreen from '../screens/home/ProfileScreen';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Entypo from '@expo/vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { ActivityIndicator, View } from 'react-native';

const Tab = createBottomTabNavigator();

const BottomTabsNavigator = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
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
            case 'Requests':
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Activity" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;