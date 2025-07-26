import React from 'react';
import "react-native-get-random-values";
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from './app/utils/queryClient';
import AppNavigator from './app/navigation/AppNavigator';
import NoInternetWarning from './app/components/utils/NoInternetUtility';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';

import { useFonts } from "expo-font";
import {
  Montserrat_100Thin,
  Montserrat_200ExtraLight,
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
  Montserrat_900Black,
  Montserrat_100Thin_Italic,
  Montserrat_200ExtraLight_Italic,
  Montserrat_300Light_Italic,
  Montserrat_400Regular_Italic,
  Montserrat_500Medium_Italic,
  Montserrat_600SemiBold_Italic,
  Montserrat_700Bold_Italic,
  Montserrat_800ExtraBold_Italic,
  Montserrat_900Black_Italic,
} from "@expo-google-fonts/montserrat";

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const AppContent = () => {
  const insets = useSafeAreaInsets();

    const [fontsLoaded] = useFonts({
    "Montserrat-Thin": Montserrat_100Thin,
    "Montserrat-ExtraLight": Montserrat_200ExtraLight,
    "Montserrat-Light": Montserrat_300Light,
    "Montserrat-Regular": Montserrat_400Regular,
    "Montserrat-Medium": Montserrat_500Medium,
    "Montserrat-SemiBold": Montserrat_600SemiBold,
    "Montserrat-Bold": Montserrat_700Bold,
    "Montserrat-ExtraBold": Montserrat_800ExtraBold,
    "Montserrat-Black": Montserrat_900Black,
    "Montserrat-ThinItalic": Montserrat_100Thin_Italic,
    "Montserrat-ExtraLightItalic": Montserrat_200ExtraLight_Italic,
    "Montserrat-LightItalic": Montserrat_300Light_Italic,
    "Montserrat-Italic": Montserrat_400Regular_Italic,
    "Montserrat-MediumItalic": Montserrat_500Medium_Italic,
    "Montserrat-SemiBoldItalic": Montserrat_600SemiBold_Italic,
    "Montserrat-BoldItalic": Montserrat_700Bold_Italic,
    "Montserrat-ExtraBoldItalic": Montserrat_800ExtraBold_Italic,
    "Montserrat-BlackItalic": Montserrat_900Black_Italic,
  });

  if (!fontsLoaded) return null;
  
  return (
      <QueryClientProvider client={queryClient}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000", paddingTop: -(insets.top)}}>
        <StatusBar
          backgroundColor="transparent"
          style='light'
          translucent={true}
        />
        <BlurView
        intensity={100}
        tint="dark"
        style={{
          position: 'absolute',
          backgroundColor: "#00000050",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          zIndex: 1000,
        }}
      />
        <NoInternetWarning />
        <AppNavigator />
    </SafeAreaView>
      </QueryClientProvider>
  );
};