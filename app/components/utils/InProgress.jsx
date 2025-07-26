import { View, Text, Image } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const InProgress = ({data}) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="items-center justify-center flex-1 bg-white" style={{ paddingTop: insets.top}}>
      <View className="items-center justify-center flex-1">
          <Image
            source={require("../../../assets/icons/info-black.png")}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />
          <Text className="text-xl font-semibold text-center">
            No New {data ? data : "Updates"} Available
          </Text>
        </View>
    </View>
  )
}

export default InProgress