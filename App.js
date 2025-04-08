import React from 'react';
import "react-native-get-random-values";
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { queryClient } from './app/utils/queryClient';
import AppNavigator from './app/navigation/AppNavigator';
import NoInternetWarning from './app/components/utils/NoInternetUtility';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <NoInternetWarning />
        <AppNavigator />
      </SafeAreaView>
    </QueryClientProvider>
  );
}