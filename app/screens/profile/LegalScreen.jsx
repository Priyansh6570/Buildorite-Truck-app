import { View, Text } from 'react-native'
import InProgress from "../../components/utils/InProgress"
import React from 'react'

const LegalScreen = () => {
  return (
    <View className="flex-1" style={
      // Add any specific styles or layout configurations here
      {
        // Example: backgroundColor: 'lightgray',
      }
    }>
      <InProgress data="Legal" />
    </View>
  )
}

export default LegalScreen