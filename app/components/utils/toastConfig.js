import Toast, { BaseToast } from "react-native-toast-message";

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "green", height: 60, width: "90%", padding: 10, marginTop: 26 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 12,
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "orange", height: 60, width: "90%", padding: 10, marginTop: 26 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 12,
      }}
    /> 
    ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: "red", height: 60, width: "90%", padding: 10, marginTop: 26 }}
      text1Style={{
        fontSize: 16,
        fontWeight: "bold",
      }}
      text2Style={{
        fontSize: 12,
      }}
    />
  ),
};

export default toastConfig;