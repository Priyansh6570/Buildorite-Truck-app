import React, { useEffect } from "react";
import "react-native-get-random-values";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { queryClient } from "./app/utils/queryClient";
import AppNavigator from "./app/navigation/AppNavigator";
import NoInternetWarning from "./app/components/utils/NoInternetUtility";
import LocationPermissionSetup from "./app/components/location/LocationPermissionSetup";
import { NotificationProvider } from "./app/context/NotificationContext";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { useAuthStore } from "./app/store/authStore";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";
import {
  useFonts,
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
import * as TaskManager from "expo-task-manager";
import { useTripStore } from "./app/store/useTripStore";
import socketService from "./app/api/driverSocket";
import Toast from "react-native-toast-message";

// Enhanced notification handler to support both tracking and regular push notifications
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔔 PUSH NOTIFICATION HANDLER TRIGGERED`);

    const { action, tripId, type, payload } = notification.request.content.data;
    console.log(`[${timestamp}] Notification data:`, { action, tripId, type, payload });

    // Handle driver location tracking notifications
    if (action === "START_TRACKING" && tripId) {
      console.log(`[${timestamp}] 🎯 Silent tracking push for trip ${tripId} - preparing for background execution`);
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      };
    }

    // Handle regular push notifications for truck owners and drivers
    if (type && payload) {
      console.log(`[${timestamp}] 🔔 Regular push notification received:`, { type, payload });
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      };
    }
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    };
  },
});

const BACKGROUND_LOCATION_TASK = "background-location-task";

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  const timestamp = new Date().toISOString();

  if (error) {
    console.error(`[${timestamp}] [Task Manager] ❌ Error:`, error.message);

    if (error.message.includes("permission") || error.message.includes("location")) {
      console.error(`[${timestamp}] [Task Manager] 🔐 Location permission error detected`);

      const activeTripId = useTripStore.getState().activeTripId;
      if (activeTripId) {
        try {
          socketService.emit("trackingError", {
            tripId: activeTripId,
            error: "permission_error",
            message: "Location permission denied during background tracking",
            timestamp: new Date().toISOString(),
          });
          console.log(`[${timestamp}] [Task Manager] 📤 Sent permission error to server`);
        } catch (socketError) {
          console.error(`[${timestamp}] [Task Manager] ❌ Failed to emit error:`, socketError);
        }
      }
    } else if (error.message.includes("location service")) {
      console.error(`[${timestamp}] [Task Manager] 🌐 Location service error`);

      const activeTripId = useTripStore.getState().activeTripId;
      if (activeTripId) {
        try {
          socketService.emit("trackingError", {
            tripId: activeTripId,
            error: "location_service_error",
            message: "Location services disabled during tracking",
            timestamp: new Date().toISOString(),
          });
        } catch (socketError) {
          console.error(`[${timestamp}] [Task Manager] ❌ Failed to emit service error:`, socketError);
        }
      }
    }
    return;
  }

  if (data) {
    const { locations } = data;
    const currentLocation = locations[0];

    if (!currentLocation) {
      console.warn(`[${timestamp}] [Task Manager] ⚠️ No location data received`);
      return;
    }

    console.log(`[${timestamp}] [Task Manager] 📍 Processing location update:`, {
      lat: currentLocation.coords.latitude,
      lng: currentLocation.coords.longitude,
      accuracy: currentLocation.coords.accuracy,
      timestamp: new Date(currentLocation.timestamp).toISOString(),
    });

    const activeTripId = useTripStore.getState().activeTripId;
    const userId = useAuthStore.getState().user?.id;

    if (!userId) {
      console.warn(`[${timestamp}] [Task Manager] ⚠️ No user ID found, skipping location update`);
      return;
    }

    // NEW: Always send location update for periodic tracking (even without active trip)
    const locationData = {
      driverId: userId,
      coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude],
      accuracy: currentLocation.coords.accuracy,
      timestamp: currentLocation.timestamp,
      source: 'background_task'
    };

    console.log(`[${timestamp}] [Task Manager] 📦 Prepared location data:`, locationData);

    // If there's an active trip, also send trip-specific update
    if (activeTripId) {
      const tripLocationData = {
        tripId: activeTripId,
        driverId: userId,
        coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude],
        accuracy: currentLocation.coords.accuracy,
        timestamp: currentLocation.timestamp,
        source: 'background_trip_task'
      };
      console.log(`[${timestamp}] [Task Manager] 🎯 Also sending trip-specific data for trip: ${activeTripId}`);
    }

    const sendLocationWithRetry = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryTimestamp = new Date().toISOString();

      try {
        if (!socketService.socket?.connected) {
          console.log(`[${retryTimestamp}] [Task Manager] 🔌 Socket not connected. Attempting to connect...`);
          socketService.connect();

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("Connection timeout"));
            }, 15000);

            if (socketService.socket?.connected) {
              clearTimeout(timeout);
              resolve();
            } else {
              const connectHandler = () => {
                console.log(`[${retryTimestamp}] [Task Manager] ✅ Socket connected successfully`);
                clearTimeout(timeout);
                socketService.socket?.off("connect", connectHandler);
                socketService.socket?.off("connect_error", errorHandler);
                resolve();
              };

              const errorHandler = (err) => {
                console.error(`[${retryTimestamp}] [Task Manager] ❌ Socket connection failed:`, err);
                clearTimeout(timeout);
                socketService.socket?.off("connect", connectHandler);
                socketService.socket?.off("connect_error", errorHandler);
                reject(err);
              };

              socketService.socket?.once("connect", connectHandler);
              socketService.socket?.once("connect_error", errorHandler);
            }
          });
        }

        console.log(`[${retryTimestamp}] [Task Manager] 🔍 Authenticating user and sending location...`);
        socketService.emit("authenticate", { userId });
        
        // NEW: Send periodic location update
        socketService.emit("driverLocationUpdate", locationData);
        
        // If active trip, also send trip-specific update
        if (activeTripId) {
          const tripLocationData = {
            tripId: activeTripId,
            driverId: userId,
            coordinates: locationData.coordinates,
            accuracy: locationData.accuracy,
            timestamp: locationData.timestamp,
            source: 'background_trip_tracking'
          };
          socketService.emit("driverTrackingLocationUpdate", tripLocationData);
          console.log(`[${retryTimestamp}] [Task Manager] 🎯 Sent trip-specific location for trip ${activeTripId}`);
        }
        
        console.log(`[${retryTimestamp}] [Task Manager] ✅ ✨✨✨✨✨ Successfully sent periodic location update`);
      } catch (error) {
        console.error(`[${retryTimestamp}] [Task Manager] ❌ Failed to send location (attempt ${retryCount + 1}):`, error);

        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 2000;
          console.log(`[${retryTimestamp}] [Task Manager] 🔄 Retrying in ${waitTime / 1000} seconds... (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            sendLocationWithRetry(retryCount + 1);
          }, waitTime);
        } else {
          console.error(`[${retryTimestamp}] [Task Manager] 💥 Max retry attempts reached. Location update failed.`);

          try {
            socketService.emit("driverLocationError", {
              driverId: userId,
              error: "location_send_failed",
              message: `Failed to send location after ${maxRetries} attempts`,
              timestamp: new Date().toISOString(),
            });
          } catch (emitError) {
            console.error(`[${retryTimestamp}] [Task Manager] ❌ Failed to emit location error:`, emitError);
          }
        }
      }
    };

    sendLocationWithRetry();
  }
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const AppContent = () => {
  const activeTripId = useTripStore((state) => state.activeTripId);
  const hasShownToast = useTripStore((state) => state.hasShownTrackingToast);
  const setToastHasBeenShown = useTripStore((state) => state.setToastHasBeenShown);

  useEffect(() => {
    if (activeTripId && !hasShownToast) {
      console.log(`[UI Effect] ✨ Tracking started for trip ${activeTripId}. Showing notification.`);

      Toast.show({
        type: "info",
        text1: "Location Tracking Active",
        text2: "Sharing your location for the current trip.",
      });
      setToastHasBeenShown();
    }
  }, [activeTripId, hasShownToast]);

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

  useEffect(() => {
    const cleanupOnStartup = async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [App Startup] 🧹 Checking for stale background tasks...`);

      try {
        const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        if (isTaskRunning) {
          console.warn(`[${timestamp}] [App Startup] ⚠️ Stale background task found. Stopping it (likely from previous crash).`);
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          console.log(`[${timestamp}] [App Startup] ✅ Stale task stopped successfully`);
        }
        const currentTripId = useTripStore.getState().activeTripId;
        if (currentTripId) {
          console.log(`[${timestamp}] [App Startup] 🗑️ Clearing stale trip ID: ${currentTripId}`);
          useTripStore.getState().clearActiveTripId();
        }

        console.log(`[${timestamp}] [App Startup] ✅ Cleanup completed successfully`);
      } catch (error) {
        console.error(`[${timestamp}] [App Startup] ❌ Cleanup error:`, error);
      }
    };

    cleanupOnStartup();
  }, []);

  React.useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries(["notifications"]);
      queryClient.invalidateQueries(["notifications-unread-count"]);
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#000", paddingTop: -insets.top }}>
          <StatusBar backgroundColor="transparent" style="light" />
          <BlurView
            intensity={100}
            tint="dark"
            style={{
              position: "absolute",
              backgroundColor: "#00000050",
              top: 0,
              left: 0,
              right: 0,
              height: insets.top,
              zIndex: 1000,
            }}
          />
          <LocationPermissionSetup />
          <NoInternetWarning />
          <AppNavigator />
        </SafeAreaView>
      </NotificationProvider>
    </QueryClientProvider>
  );
};