import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import { useLogoutUser } from '../../hooks/useAuth';

const ProfileScreen = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const logoutUser = useLogoutUser();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = () => {
    logoutUser.mutate(null, {
      onSuccess: () => {
        setModalVisible(false);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      },
    });
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <ScrollView className="flex-1 p-4 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor={'#fff'} />
      {/* User Name and Role */}
      <View className="flex-row justify-between">
      <View className="flex justify-start b-6 w-[80%] rounded-lg">
        <Text className="text-4xl font-bold uppercase">{ user?.name || 'User Name'}</Text>
        <Text className="px-3 py-1 text-sm rounded-full w-[90px] bg-slate-50">{user?.role}</Text>
      </View>
      <Image source={require('../../../assets/icons/profile.png')} className="w-[65px] h-[65px]" />
      </View>

      {/* Horizontal Boxes */}
      <View className="flex-row justify-between mt-6 mb-6">
        <TouchableOpacity onPress={() => navigation.navigate('Help')} className="items-center w-[30%] p-6 mx-1 bg-gray-100 rounded-lg">
          <Image source={require('../../../assets/icons/help.png')} className="w-6 h-6 mb-2" />
          <Text>Help</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Wallet')} className="items-center w-[30%] p-6 mx-1 bg-gray-100 rounded-lg">
          <Image source={require('../../../assets/icons/wallet.png')} className="w-6 h-6 mb-2" />
          <Text>Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} className="items-center w-[30%] p-6 mx-1 bg-gray-100 rounded-lg">
          <Image source={require('../../../assets/icons/activity-black.png')} className="w-6 h-6 mb-2 mr-2" />
          <Text>Activity</Text>
        </TouchableOpacity>
      </View>

      {/* Vertical Boxes */}
      {/* <TouchableOpacity onPress={() => navigation.navigate('Mine')} className="flex-row items-center justify-between p-8 mb-4 overflow-hidden bg-gray-100 border-2 border-gray-100 rounded-lg">
        <View>
          <Text className="text-lg">Mines</Text>
          <Text className="text-slate-500 text-md">Manage your Mines and materials</Text>
        </View>
        <Image source={require('../../../assets/icons/mine.png')} className="w-12 h-12 scale-[2] relative top-4" />
      </TouchableOpacity> */}

      <TouchableOpacity onPress={() => navigation.navigate('Truck')} className="flex-row items-center justify-between p-8 mb-4 overflow-hidden bg-gray-100 border-2 border-gray-100 rounded-lg">
        <View>
          <Text className="text-lg">My Trucks</Text>
          <Text className="text-slate-500 text-md">Manage your Trucks/Drivers</Text>
        </View>
        <Image source={require('../../../assets/icons/truck.jpg')} className="w-12 h-12 scale-[3] relative rounded-full" />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Requests')} className="flex-row items-center justify-between p-8 mb-4 overflow-hidden bg-gray-100 border-2 border-gray-100 rounded-lg">
        <View>
          <Text className="text-lg">Requests</Text>
          <Text className="text-slate-500 text-md">View Your Requests</Text>
        </View>
        <Image source={require('../../../assets/icons/requests.png')} className="w-12 h-12 scale-[2.5] relative top-4" />
      </TouchableOpacity>

      {/* Horizontal Rule */}
      <View className="h-1 my-2 bg-gray-100" />

      {/* Common Services */}
      <View className="p-2 mt-4">
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} className="flex-row items-center mb-8">
        <Image source={require('../../../assets/icons/settings.png')} className="w-4 h-4 mr-3" />
        <Text className="text-lg font-medium">Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Messages')} className="flex-row items-center mb-8">
        <Image source={require('../../../assets/icons/messages.png')} className="w-4 h-4 mr-3" />
        <Text className="text-lg font-medium">Messages</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Trips')} className="flex-row items-center mb-8">
        <Image source={require('../../../assets/icons/trip.png')} className="w-4 h-4 mr-3" />
        <Text className="text-lg font-medium">View Trips</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Legal')} className="flex-row items-center mb-8">
        <Image source={require('../../../assets/icons/legal.png')} className="w-4 h-4 mr-3" />
        <Text className="text-lg font-medium">Legal</Text>
      </TouchableOpacity>

       <TouchableOpacity onPress={() => setModalVisible(true)} className="flex-row items-center mb-8">
          <Image source={require('../../../assets/icons/signout.png')} className="w-4 h-4 mr-3" />
          <Text className="text-lg font-medium text-red-600">Sign Out</Text>
        </TouchableOpacity>
      </View>
      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        statusBarTranslucent={true}
        navigationBarTranslucent={true}
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        {/* <StatusBar barStyle="dark-content" backgroundColor={'#00000090'} /> */}
        <Pressable onPress={closeModal} className="items-center justify-center flex-1 bg-[00000060] bg-opacity-50">
          <View className="w-4/5 p-6 bg-white rounded-lg">
            <Text className="mb-4 text-lg font-bold text-center">Do you want to sign out?</Text>

            <TouchableOpacity
              onPress={handleLogout}
              className="w-full py-3 mt-4 bg-red-500 rounded-lg shadow-lg shadow-red-400"
            >
              <Text className="font-semibold text-center text-white">
                {logoutUser.isLoading ? <ActivityIndicator color='#fff' /> : 'Sign Out'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

export default ProfileScreen;