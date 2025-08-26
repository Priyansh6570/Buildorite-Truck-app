import { View, Text } from 'react-native'
import InProgress from '../../components/utils/InProgress'
import React from 'react'

const WalletScreen = () => {
  return (
    <View className="flex-1">
      <InProgress data={"Wallet screen"} />
    </View>
  )
}

export default WalletScreen