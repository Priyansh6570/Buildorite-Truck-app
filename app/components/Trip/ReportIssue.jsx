import { View, Text } from 'react-native'
import { useReportIssue } from "../../hooks/useTrip"

const ReportIssue = () => {
  const { reportIssue } = useReportIssue()

  return (
    <View>
      <Text>ReportIssue</Text>
    </View>
  )
}

export default ReportIssue