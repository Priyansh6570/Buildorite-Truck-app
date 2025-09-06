import { View, Text } from 'react-native'
import InProgress from "../../components/utils/InProgress"

const LegalScreen = () => {
  return (
    <View className="flex-1">
      <InProgress data="Legal" />
    </View>
  )
}

export default LegalScreen