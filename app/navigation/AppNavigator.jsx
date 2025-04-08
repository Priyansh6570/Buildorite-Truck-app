import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import toastConfig from "../components/utils/toastConfig";
import { useAuthStore } from "../store/authStore";
import { ActivityIndicator, StatusBar, View } from "react-native";
import { navigationRef } from "./navigationRef";

import AuthScreen from "../screens/auth/AuthScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import AddTruckScreen from "../screens/auth/AddTruckScreen";
import BottomTabsNavigator from "./BottomTabsNavigator";
import BottomTabsNavigatorDriver from "./BottomTabsNavigatorDriver";

import HelpScreen from "../screens/profile/HelpScreen";
import WalletScreen from "../screens/profile/WalletScreen";
import NotificationsScreen from "../screens/home/NotificationsScreen";
import TruckScreen from "../screens/profile/TruckScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import MessagesScreen from "../screens/profile/MessagesScreen";
import TripsScreen from "../screens/profile/TripsScreen";
import LegalScreen from "../screens/profile/LegalScreen";

import ViewMineScreen from "../screens/mine/ViewMineScreen";

import MaterialDetailsScreen from "../screens/material/MaterialDetailsScreen";
import ViewMaterialsScreen from "../screens/material/ViewMaterialsScreen";

import SearchScreen from "../screens/home/SearchScreen";

import MineDetail from "../components/home/MineDetail";
import MaterialDetail from "../components/home/MaterialDetail";
import MineMaterials from "../components/home/MineMaterials";

import AccountScreen from "../screens/settings/AccountScreen";
import ReportBugScreen from "../screens/settings/ReportBugScreen";
import FeedbackScreen from "../screens/settings/FeedbackScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(false);
    };
  
    initializeAuth();
  }, [accessToken]);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="grey" />
      </View>
    );
  }
  

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Stack.Navigator initialRouteName={user ? (user.role == "driver"? "DBNav" : "Main") : "Auth"} screenOptions={{
          headerShown: false,
          detachInactiveScreens: false
        }}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={BottomTabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="DBNav" component={BottomTabsNavigatorDriver} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AddTruck" component={AddTruckScreen} options={{ headerShown: false }} />

        {/* Profile Routes */}
        <Stack.Screen name="Help" component={HelpScreen} options={{headerShown:false}} />
        <Stack.Screen name="Wallet" component={WalletScreen} options={{headerShown:false}} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{headerShown:false}} />
        <Stack.Screen name="Truck" component={TruckScreen} options={{headerShown:false}} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{headerShown:false}} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{headerShown:false}} />
        <Stack.Screen name="Trips" component={TripsScreen} options={{headerShown:false}} />
        <Stack.Screen name="Legal" component={LegalScreen} options={{headerShown:false}} />

        {/* mine route  */}
        <Stack.Screen name="MyMine" component={ViewMineScreen} options={{headerShown:false}} />

        <Stack.Screen name="MyMaterials" component={ViewMaterialsScreen} options={{headerShown:false}} />
        <Stack.Screen name="MaterialDetails" component={MaterialDetailsScreen} options={{headerShown:false}} />

        <Stack.Screen name="SearchScreen" component={SearchScreen} options={{headerShown:false}} />

        <Stack.Screen name="MineDetail" component={MineDetail} options={{ headerShown: false }} />
        <Stack.Screen name="MaterialDetail" component={MaterialDetail} options={{ headerShown: false }} />
        <Stack.Screen name="MineMaterials" component={MineMaterials} options={{ headerShown: false }} />

        {/* Settings */}
        <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ReportBug" component={ReportBugScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <Toast config={toastConfig} />
    </NavigationContainer>
  );
};

export default AppNavigator;