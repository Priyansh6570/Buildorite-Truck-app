import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome6,
  FontAwesome5,
  FontAwesome,
  Octicons,
} from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { useNavigation } from "@react-navigation/native";
import { useLogoutUser } from "../../hooks/useAuth";
import { useFetchUserTripCounts } from "../../hooks/useTrip";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";

const DriverProfileScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const logoutUser = useLogoutUser();
  const [pressedAction, setPressedAction] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutBottomSheetRef = useRef(null);
  const insets = useSafeAreaInsets();

  const { data: tripCountsData } = useFetchUserTripCounts();
  const completedTrips = tripCountsData?.completedTripsCount || 0;
  const pendingTrips = tripCountsData?.activeTripsCount || 0;

  const handleLogout = () => {
    setIsSigningOut(true);
    logoutUser.mutate(null, {
      onSuccess: () => {
        signOutBottomSheetRef.current?.close();
        navigation.reset({
          index: 0,
          routes: [{ name: "Auth" }],
        });
        setIsSigningOut(false);
      },
      onError: () => {
        setIsSigningOut(false);
      }
    });
  };

  const handleSignOutPress = () => {
    signOutBottomSheetRef.current?.snapToIndex(0);
  };

  const handleSignOutCancel = () => {
    signOutBottomSheetRef.current?.close();
  };

  const getRoleDisplayName = (role) => {
    return role === 'driver' ? 'Driver' : 'User';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
      <ScrollView className="flex-1">
        {/* Header Section */}
        <View className="pt-14 pb-14 bg-[#151E2C]" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-8 pt-4 pb-2">
            <View className="flex-row items-center">
              <View className="relative overflow-hidden border border-slate-500 rounded-xl">
                <Image
                  source={require("../../../assets/icons/profile.png")}
                  className="w-16 h-16 scale-[1.4]"
                />
                <View className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
              </View>
              <View className="ml-4">
                <Text className="text-2xl font-bold text-white">
                  {user?.name || "Driver Name"}
                </Text>
                <View className="mr-auto px-4 py-1 mt-1 bg-[#263c43] border border-[#266b68] rounded-full bg-opacity-20 border-opacity-60">
                  <Text className="text-sm font-bold text-cyan-400">
                    {getRoleDisplayName(user?.role)}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate("Notifications")}
              className="p-3 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl"
            >
              <FontAwesome6 name="bell" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between px-6 mt-6">
            <View className="flex-1 p-4 py-6 mx-2 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
              <Text className="text-3xl font-bold text-center text-white">
                {completedTrips}
              </Text>
              <Text className="font-semibold text-center text-gray-300 text-md">
                Completed Trips
              </Text>
            </View>
            <View className="flex-1 p-4 py-6 mx-2 bg-[#2C3441] bg-opacity-50 border border-slate-500 rounded-xl">
              <Text className="text-3xl font-bold text-center text-white">
                {pendingTrips}
              </Text>
              <Text className="font-semibold text-center text-gray-300 text-md">
                Pending Trips
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6">
          {/* Quick Actions Section */}
          <View className="z-10 p-6 py-8 -mt-6 bg-white shadow-2xl rounded-3xl" style={{elevation: 20}}>
            <Text className="mb-6 text-2xl font-bold text-gray-800">
              Quick Actions
            </Text>
            <View className="flex-row justify-around gap-4">
              <TouchableOpacity
                onPress={() => navigation.navigate("DriverHelp")}
                onPressIn={() => setPressedAction("help")}
                activeOpacity={1}
                onPressOut={() => setPressedAction(null)}
                className={`items-center ${
                  pressedAction === "help" ? "bg-blue-100" : "bg-blue-50"
                } p-4 rounded-xl py-6 flex-1 mx-1`}
              >
                <View className="p-3 mb-2 bg-blue-500 rounded-xl">
                  <FontAwesome6 name="headset" size={20} color="#ffffff" />
                </View>
                <Text className="text-sm font-semibold text-gray-700">
                  Help
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Notifications")}
                onPressIn={() => setPressedAction("activity")}
                onPressOut={() => setPressedAction(null)}
                activeOpacity={1}
                className={`items-center ${
                  pressedAction === "activity"
                    ? "bg-purple-100"
                    : "bg-purple-50"
                } p-4 py-6 rounded-xl flex-1 mx-1`}
              >
                <View className="p-3 mb-2 bg-purple-500 rounded-xl">
                  <Octicons name="graph" size={20} color="#ffffff" />
                </View>
                <Text className="text-sm font-semibold text-gray-700">
                  Activity
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Section */}
          <View className="flex gap-4 mt-8 space-y-4">
            <TouchableOpacity
              onPress={() => navigation.navigate("Trips")}
              activeOpacity={0.9}
              className="flex-row items-center justify-between p-8 py-10 bg-white border shadow-sm border-slate-100 rounded-xl elevation-2 active:bg-gray-50"
            >
              <View className="flex-row items-center">
                <View className="overflow-hidden rounded-xl">
                <LinearGradient
                  colors={["#60a5fa", "#2563eb"]}
                  className="p-4"
                >
                  <FontAwesome5 name="route" size={24} color="#ffffff" />
                </LinearGradient>
                </View>
                <View className="ml-5">
                  <Text className="text-xl font-bold text-gray-800">
                    My Trips
                  </Text>
                  <Text className="text-md w-[90%] font-medium text-gray-500">
                    View your assigned trips
                  </Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={16} color="#4B5563" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("TripSchedule")}
              activeOpacity={0.9}
              className="flex-row items-center justify-between p-8 py-10 bg-white border shadow-sm border-slate-100 rounded-xl elevation-2 active:bg-gray-50"
            >
              <View className="flex-row items-center">
                <View className="overflow-hidden rounded-xl">
                  <LinearGradient
                    colors={["#2dd4bf", "#0d9488"]}
                    className="p-4"
                  >
                    <FontAwesome5 name="calendar-alt" size={24} color="#ffffff" solid />
                </LinearGradient>
                </View>
                <View className="ml-5">
                  <Text className="text-xl font-bold text-gray-800">
                    Schedule
                  </Text>
                  <Text className="text-md w-[100%] font-medium text-gray-500">
                    Check your trip schedule
                  </Text>
                </View>
              </View>
              <FontAwesome6 name="chevron-right" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Account & Settings */}
          <View className="mt-8 mb-6">
            <Text className="mb-6 text-2xl font-bold text-gray-800">
              Account & Settings
            </Text>
            <View className="overflow-hidden bg-white border shadow-sm border-slate-100 rounded-xl">
              <TouchableOpacity
                onPress={() => navigation.navigate("Settings")}
                activeOpacity={0.8}
                className="flex-row items-center justify-between p-4 border-b border-slate-100 active:bg-gray-50"
              >
                <View className="flex-row items-center">
                  <View className="p-3 bg-gray-100 rounded-xl">
                    <FontAwesome6 name="gear" size={20} color="#6B7280" />
                  </View>
                  <Text className="ml-4 font-semibold text-gray-800 text-md">
                    Settings
                  </Text>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#4B5563" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Legal")}
                activeOpacity={0.8}
                className="flex-row items-center justify-between p-4 border-b border-slate-100 active:bg-gray-50"
              >
                <View className="flex-row items-center">
                  <View className="p-3 bg-gray-100 rounded-xl">
                    <FontAwesome name="legal" size={20} color="#6B7280" />
                  </View>
                  <Text className="ml-4 font-semibold text-gray-800">
                    Legal
                  </Text>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#4B5563" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSignOutPress}
                activeOpacity={0.8}
                className="flex-row items-center justify-between p-4 active:bg-red-50"
              >
                <View className="flex-row items-center">
                  <View className="p-3 rounded-xl bg-[#FEE2E2]">
                    <FontAwesome name="sign-out" size={20} color="#EF4444" />
                  </View>
                  <Text className="ml-4 font-semibold text-red-500">
                    Sign Out
                  </Text>
                </View>
                <FontAwesome6 name="chevron-right" size={16} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </View>
      {/* Sign Out Bottom Sheet */}
      <ReusableBottomSheet
        ref={signOutBottomSheetRef}
        snapPoints={['45%']}
        enablePanDownToClose={true}
      >
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
                      <View className="p-4 mb-6 bg-red-100 rounded-full">
                        <FontAwesome name="sign-out" size={28} color="#EF4444" />
                      </View>
                      <Text className="mb-3 text-2xl font-bold text-center text-gray-900">
                        Sign Out
                      </Text>
                      <Text className="text-center text-gray-600 text-md">
                        Are you sure you want to sign out of your account?
                      </Text>
                      <Text className="mt-2 text-sm text-center text-gray-500">
                        You'll need to sign in again to access your account.
                      </Text>
                    </View>

          <View className="gap-4 mt-auto">
            <TouchableOpacity
              onPress={handleLogout}
              disabled={isSigningOut}
              className="flex-row items-center justify-center p-4 bg-red-500 rounded-2xl"
            >
              {isSigningOut ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <FontAwesome name="sign-out" size={18} color="#ffffff" />
                  <Text className="ml-2 text-lg font-bold text-white">
                    Sign Out
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSignOutCancel}
              className="p-4 bg-gray-100 rounded-2xl"
              disabled={isSigningOut}
            >
              <Text className="text-lg font-bold text-center text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </SafeAreaView>
  );
};

export default DriverProfileScreen;