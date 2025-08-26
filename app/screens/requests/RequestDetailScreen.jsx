import React, { useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Platform, TextInput, FlatList, Modal, Alert, Image, Dimensions, RefreshControl } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useFetchRequestById, useUpdateRequestStatus, useAssignDriver } from "../../hooks/useRequest";
import { useFetchMyDrivers } from "../../hooks/useTruck";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6, Feather, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { format, isSameDay, formatDistanceToNow } from "date-fns";
import Toast from "react-native-toast-message";
import ReusableBottomSheet from "../../components/Ui/ReusableBottomSheet";
import { LinearGradient } from "expo-linear-gradient";
import { WebView } from "react-native-webview";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// --- Helper Constants & Components ---

const REJECTION_REASONS = ["Price is too low", "Out of stock", "Scheduling conflict", "Cannot meet terms"];

// Re-usable component for detail rows in modals
const DetailRow = ({ icon, label, value, iconColor = "#6366F1" }) => (
  <View className="flex-row items-start mb-6">
    <View className="items-center justify-center w-10 h-10 mr-4 bg-gray-100 rounded-xl">
      <FontAwesome6 name={icon} size={16} color={iconColor} />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-medium tracking-wide text-gray-500 uppercase">{label}</Text>
      {value && <Text className="mt-1 text-lg font-semibold text-gray-900">{value}</Text>}
    </View>
  </View>
);

const GetDirectionsButton = ({ startLocation, endLocation }) => {
  const openDirections = async () => {
    if (!endLocation?.coordinates || !startLocation?.coordinates) {
      Toast.show({ type: "error", text1: "Location data is missing." });
      return;
    }
    try {
      const [startLng, startLat] = startLocation.coordinates;
      const [endLng, endLat] = endLocation.coordinates;
      const url = Platform.select({
        ios: `http://maps.apple.com/?saddr=${startLat},${startLng}&daddr=${endLat},${endLng}&dirflg=d`,
        android: `google.navigation:q=${endLat},${endLng}&mode=d`,
      });
      const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${endLat},${endLng}&travelmode=driving`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else await Linking.openURL(fallbackUrl);
    } catch (error) {
      console.error("Error opening directions:", error);
      Toast.show({ type: "error", text1: "Could not open maps." });
    }
  };
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={openDirections} className="flex-row items-center justify-center px-6 py-4 mt-4 border border-blue-200 rounded-xl bg-blue-50">
      <MaterialIcons name="directions" size={20} color="#2563EB" />
      <Text className="ml-2 text-base font-semibold text-blue-600">Get Directions</Text>
    </TouchableOpacity>
  );
};

const DriverCard = ({ driver, isSelected, onSelect, requestScheduleDate }) => {
  const hasTruck = !!driver.truck;
  const isBusy = hasTruck && driver.schedule?.date && requestScheduleDate && isSameDay(new Date(driver.schedule.date), new Date(requestScheduleDate));
  const isAvailable = hasTruck && !isBusy;

  const getStatus = () => {
    if (!hasTruck) return { text: "No Truck", style: "text-red-700 bg-red-50 border-red-200" };
    if (isBusy) return { text: `Busy on ${format(new Date(driver.schedule.date), "MMM d")}`, style: "text-amber-700 bg-amber-50 border-amber-200" };
    return { text: "Available", style: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  };

  const statusInfo = getStatus();

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => isAvailable && onSelect(driver._id)} disabled={!isAvailable} className={`p-5 mb-4 border-2 rounded-xl ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white"} ${!isAvailable && "opacity-50"}`}>
      <View className="flex-row items-center">
        <View className="items-center justify-center w-12 h-12 mr-4 bg-gray-100 rounded-xl">
          <FontAwesome6 name="user" size={20} color="#374151" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{driver.name}</Text>
          <Text className="text-base text-gray-600">{driver.truck?.name || "No truck assigned"}</Text>
          {driver.truck?.reg && <Text className="text-sm text-gray-400">{driver.truck.reg}</Text>}
        </View>
        <View className={`px-3 py-2 rounded-full border ${statusInfo.style}`}>
          <Text className="text-xs font-semibold">{statusInfo.text}</Text>
        </View>
      </View>
      {isSelected && (
        <View className="flex-row items-center justify-center w-6 h-6 mt-3 ml-auto bg-blue-500 rounded-full">
          <Feather name="check" size={14} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
};

// Enhanced Document viewer component with actual viewing capabilities
const DocumentViewer = ({ visible, onClose, document }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  const isPDF = document?.url?.toLowerCase().includes(".pdf") || document?.type === "pdf";
  const isImage = document?.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || document?.type === "image";

  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setImageError(false);
  };

  React.useEffect(() => {
    if (visible) {
      resetState();
    }
  }, [visible]);

  const renderPDFViewer = () => (
    <WebView
      source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(document.url)}` }}
      style={{ flex: 1 }}
      onLoadStart={() => setIsLoading(true)}
      onLoadEnd={() => setIsLoading(false)}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error("WebView error: ", nativeEvent);
        setError("Failed to load PDF");
        setIsLoading(false);
      }}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      mixedContentMode="compatibility"
      allowsBackForwardNavigationGestures={false}
      renderLoading={() => (
        <View className="absolute inset-0 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading PDF...</Text>
        </View>
      )}
    />
  );

  const renderImageViewer = () => (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} maximumZoomScale={5} minimumZoomScale={1} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      <View className="items-center justify-center flex-1 p-4">
        {!imageError ? (
          <Image
            source={{ uri: document.url }}
            style={{
              width: screenWidth - 32,
              height: screenHeight * 0.7,
              resizeMode: "contain",
            }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={() => {
              setImageError(true);
              setIsLoading(false);
              setError("Failed to load image");
            }}
          />
        ) : (
          <View className="items-center justify-center flex-1">
            <FontAwesome6 name="image" size={64} color="#EF4444" />
            <Text className="mt-4 text-lg font-bold text-gray-900">Failed to Load Image</Text>
            <Text className="mt-2 text-center text-gray-600">The image could not be loaded. Please check your internet connection.</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setImageError(false);
                resetState();
              }}
              className="px-6 py-3 mt-4 bg-blue-500 rounded-xl"
            >
              <Text className="font-bold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && !imageError && (
          <View className="absolute inset-0 items-center justify-center bg-white bg-opacity-80">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4 text-gray-600">Loading image...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderErrorView = () => (
    <View className="items-center justify-center flex-1 p-8">
      <FontAwesome6 name="exclamation-triangle" size={64} color="#EF4444" />
      <Text className="mt-4 text-xl font-bold text-gray-900">Unable to Load Document</Text>
      <Text className="mt-2 text-center text-gray-600">{error || "The document could not be displayed. Please try again or check your internet connection."}</Text>
      <View className="flex-row gap-4 mt-6">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            resetState();
            // Force re-render by updating a state
          }}
          className="px-6 py-3 bg-blue-500 rounded-xl"
        >
          <Text className="font-bold text-white">Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(document?.url)} className="px-6 py-3 bg-gray-500 rounded-xl">
          <Text className="font-bold text-white">Open Externally</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUnsupportedFormat = () => (
    <View className="items-center justify-center flex-1 p-8">
      <FontAwesome6 name="file" size={64} color="#6B7280" />
      <Text className="mt-4 text-xl font-bold text-gray-900">Unsupported Format</Text>
      <Text className="mt-2 text-center text-gray-600">This file format is not supported for in-app viewing. You can open it with an external app.</Text>
      <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(document?.url)} className="px-6 py-3 mt-6 bg-blue-500 rounded-xl">
        <Text className="font-bold text-white">Open Externally</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal transparent={true} visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.documentViewerContainer}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200" style={{ paddingTop: Platform.OS === "ios" ? 50 : 20 }}>
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} className="p-2">
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="flex-1 mx-4 text-lg font-bold text-center text-gray-900" numberOfLines={1}>
            {document?.caption || "Document"}
          </Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => Linking.openURL(document?.url)} className="p-2">
            <Feather name="external-link" size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 bg-gray-100">{error ? renderErrorView() : isPDF ? renderPDFViewer() : isImage ? renderImageViewer() : renderUnsupportedFormat()}</View>
      </View>
    </Modal>
  );
};
// --- Main Screen Component ---

const RequestDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { requestId, userType } = route.params;

  // --- State and Hooks ---
  const { data: request, isLoading, isError, refetch } = useFetchRequestById(requestId);
  const { data: drivers, isLoading: isLoadingDrivers } = useFetchMyDrivers();
  const { mutate: updateStatus } = useUpdateRequestStatus();
  const { mutate: assignDriver } = useAssignDriver();

  const rejectBottomSheetRef = useRef(null);
  const acceptBottomSheetRef = useRef(null);
  const assignDriverSheetRef = useRef(null);

  const mineContactSheetRef = useRef(null);
  const driverContactSheetRef = useRef(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isConfirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState(null);
  const [documentViewer, setDocumentViewer] = useState({ visible: false, document: null });
  const [refreshing, setRefreshing] = useState(false);
  const [isPressAccept, setIsPressAccept] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  // --- Derived State ---
  const assignableDrivers = drivers?.filter((d) => d.truck && d.truck._id);
  const availableDriversForChange = drivers?.filter((d) => d.truck && d.truck._id && d._id !== request?.driver_id?._id);

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading request details...</Text>
      </View>
    );
  }
  if (isError || !request) {
    return (
      <View style={styles.container}>
        <FontAwesome6 name="exclamation-triangle" size={48} color="#EF4444" />
        <Text className="mt-4 text-lg font-semibold text-gray-900">Could not load request</Text>
        <Text className="text-gray-600">Please try again later</Text>
      </View>
    );
  }
  console.log(JSON.stringify(request, null, 2));
  const agreement = request.finalized_agreement || request.current_proposal;
  const otherPartyName = request.mine_id.owner_id.name;
  const isDelivery = agreement.delivery_method === "delivery";

  const handleCallPress = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
      mineContactSheetRef.current?.close();
      driverContactSheetRef.current?.close();
    }
  };

  // --- Event Handlers ---
  const handleViewDocument = (file) => {
    setDocumentViewer({ visible: true, document: file });
  };

  const handleOpenRejectSheet = () => rejectBottomSheetRef.current?.snapToIndex(0);
  const handleCloseRejectSheet = () => rejectBottomSheetRef.current?.close();
  const handleReject = () => {
    if (isProcessing) return;
    const finalReason = customReason.trim() || rejectionReason;
    if (!finalReason) {
      Toast.show({ type: "error", text1: "Please select or provide a reason." });
      return;
    }
    setIsProcessing(true);
    updateStatus(
      { requestId, status: "rejected", reason: finalReason },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Request Rejected" });
          handleCloseRejectSheet();
          navigation.goBack();
        },
        onError: (error) => Toast.show({ type: "error", text1: "Failed to reject", text2: error.message }),
        onSettled: () => setIsProcessing(false),
      }
    );
  };

  const handleOpenAcceptSheet = () => acceptBottomSheetRef.current?.snapToIndex(0);
  const handleCloseAcceptSheet = () => {
    setSelectedDriverId(null);
    acceptBottomSheetRef.current?.close();
  };

  const handleAcceptanceFlow = ({ assignLater = false }) => {
    if (!assignLater && !isDelivery && !selectedDriverId) {
      Toast.show({ type: "error", text1: "Please select a driver or choose to assign later." });
      return;
    }
    
    const details = {
      assignLater,
      driver: assignLater ? null : drivers.find((d) => d._id === selectedDriverId),
    };
    setConfirmationDetails(details);
    setConfirmationModalVisible(true);
    handleCloseAcceptSheet();
  };

  const executeAcceptance = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    updateStatus(
      { requestId, status: "accepted" },
      {
        onSuccess: () => {
          if (isDelivery && !confirmationDetails.assignLater && confirmationDetails.driver) {
            assignDriver(
              { requestId, driver_id: confirmationDetails.driver._id },
              {
                onSuccess: () => {
                  Toast.show({ type: "success", text1: "Accepted & Driver Assigned!" });
                  refetch();
                },
                onError: (err) => Toast.show({ type: "error", text1: "Accepted, but failed to assign driver.", text2: err.message }),
                onSettled: () => {
                  setConfirmationModalVisible(false);
                  setIsProcessing(false);
                },
              }
            );
          } else {
            Toast.show({ type: "success", text1: "Request Accepted!", text2: "Agreement has been finalized." });
            setConfirmationModalVisible(false);
            setIsProcessing(false);
            refetch();
          }
        },
        onError: (err) => {
          Toast.show({ type: "error", text1: "Failed to accept", text2: err.message });
          setIsProcessing(false);
        },
      }
    );
  };

  const handleOpenAssignDriverSheet = () => assignDriverSheetRef.current?.snapToIndex(0);
  const handleCloseAssignDriverSheet = () => {
    setSelectedDriverId(null);
    assignDriverSheetRef.current?.close();
  };
  const handleConfirmAssignDriver = () => {
    if (!selectedDriverId) {
      Toast.show({ type: "error", text1: "Please select a driver." });
      return;
    }
    setIsAssigning(true);
    assignDriver(
      { requestId, driver_id: selectedDriverId },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Driver Assigned Successfully!" });
          handleCloseAssignDriverSheet();
          refetch();
        },
        onError: (err) => Toast.show({ type: "error", text1: "Failed to assign driver", text2: err.message }),
        onSettled: () => setIsAssigning(false),
      }
    );
  };

  // --- Render Functions for UI Sections ---

  const renderStatusBadge = () => {
    const statusConfig = {
      pending: { text: "Pending Response", color: "#F59E0B", bgColor: "#FEF3C7", icon: "clock" },
      countered: { text: "Counter Offer", color: "#F97316", bgColor: "#FED7AA", icon: "arrows-left-right" },
      accepted: { text: "Agreement Finalized", color: "#10B981", bgColor: "#D1FAE5", icon: "check-circle" },
      rejected: { text: "Request Rejected", color: "#EF4444", bgColor: "#FEE2E2", icon: "times-circle" },
      canceled: { text: "Request Canceled", color: "#6B7280", bgColor: "#F3F4F6", icon: "ban" },
      in_progress: { text: "Trip in Progress", color: "#3B82F6", bgColor: "#DBEAFE", icon: "truck" },
      completed: { text: "Trip Completed", color: "#8B5CF6", bgColor: "#EDE9FE", icon: "flag-checkered" },
    };

    const { text, color, bgColor, icon } = statusConfig[request.status] || { text: "Unknown", color: "#6B7280", bgColor: "#F3F4F6", icon: "question" };

    return (
      <View className="mt-6 mr-4">
        <View className="flex-row items-center self-start justify-start px-4 py-4 border rounded-xl" style={{ backgroundColor: bgColor, borderColor: color }}>
          <FontAwesome6 name={icon} size={16} color={color} />
          <Text className="ml-2 text-sm font-bold" style={{ color }}>
            {text}
          </Text>
        </View>
      </View>
    );
  };

  const renderTripDetailButton = () => {
    return (
      <View className="mt-6 ">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("TruckOwnerTripDetail", { tripId: request.trip_id })}
          className="flex-row items-center justify-center px-6 py-4 border rounded-xl"
          style={{
            backgroundColor: "#F8FAFC",
            borderColor: "#3B82F6",
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <FontAwesome6 name="eye" size={16} color="#3B82F6" />
          <Text className="ml-2 text-sm font-bold" style={{ color: "#3B82F6" }}>
            View Trip Details
          </Text>
          <FontAwesome6 name="chevron-right" size={12} color="#3B82F6" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderActionPanel = () => {
    const { status, last_updated_by } = request;

    if ((status === "pending" || status === "countered") && last_updated_by !== userType) {
      return (
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row gap-4 mb-4">
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenAcceptSheet} className="flex-1 py-4 bg-emerald-500 rounded-xl">
              <View className="flex-row items-center justify-center">
                <Feather name="check" size={18} color="white" />
                <Text className="ml-2 text-lg font-bold text-white">Accept</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenRejectSheet} className="flex-1 py-4 bg-red-500 rounded-xl">
              <View className="flex-row items-center justify-center">
                <Feather name="x" size={18} color="white" />
                <Text className="ml-2 text-lg font-bold text-white">Reject</Text>
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("CounterRequest", { request })} className="py-4 bg-white border-2 border-blue-200 rounded-xl">
            <View className="flex-row items-center justify-center">
              <FontAwesome6 name="reply" size={16} color="#3B82F6" />
              <Text className="ml-2 text-lg font-bold text-blue-600">Make Counter Offer</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    // Waiting for other party
    if ((status === "pending" || status === "countered") && last_updated_by === userType) {
      return (
        <View className="p-6 m-6 border border-blue-200 bg-blue-50 rounded-xl">
          <View className="flex-row items-center justify-center">
            <ActivityIndicator size="small" color="#2563EB" />
            <Text className="ml-3 text-lg font-semibold text-blue-800">Awaiting response from {otherPartyName}...</Text>
          </View>
        </View>
      );
    }

    // Handle other status states...
    if (status === "canceled" && last_updated_by === userType) {
      return (
        <View className="p-6 m-6 border border-red-200 bg-red-50 rounded-xl">
          <View className="flex-row items-center">
            <FontAwesome6 name="times-circle" size={20} color="#DC2626" />
            <Text className="ml-3 text-lg font-semibold text-red-800">You canceled this request</Text>
          </View>
          {request.cancellation_reason && <Text className="pl-8 mt-2 text-sm text-red-600">{request.cancellation_reason}</Text>}
        </View>
      );
    }

    if (status === "accepted") {
      if (!request.driver_id && isDelivery) {
        return (
          <View className="p-6 m-6 border border-green-200 bg-green-50 rounded-xl">
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="ml-3 text-lg font-semibold text-green-800">Awaiting driver assignment from {otherPartyName}</Text>
            </View>
          </View>
        );
      }
      if (!request.driver_id && !isDelivery) {
        return (
          <View className="p-6 m-6 mb-10 space-y-4 border border-green-200 bg-green-50 rounded-xl">
            <View className="flex-row items-center mb-4">
              <FontAwesome6 name="check-circle" size={20} color="#059669" />
              <Text className="ml-3 text-lg font-semibold text-green-800">Agreement Finalized!</Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenAssignDriverSheet} className="py-4 bg-green-600 rounded-xl">
              <View className="flex-row items-center justify-center">
                <FontAwesome6 name="user-plus" size={18} color="white" />
                <Text className="ml-2 text-lg font-bold text-white">Assign a Driver</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (status === "in_progress") {
      if (!isDelivery) {
        return (
          <View className="p-6 m-6 border border-blue-200 bg-blue-50 rounded-xl">
            <Text className="mb-3 text-base font-semibold text-blue-800">Driver assigned for pickup</Text>

            <View className="flex-row items-center justify-between p-4 mb-4 bg-blue-100 rounded-lg">
              <View className="flex-row items-center flex-1">
                <FontAwesome6 name="truck" size={20} color="#2563EB" />
                <Text className="flex-shrink ml-3 text-lg font-semibold text-blue-800" numberOfLines={1} ellipsizeMode="tail">
                  {request.driver_id.name}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={() => driverContactSheetRef.current?.snapToIndex(0)} className="ml-4 flex-row items-center px-4 py-2.5 bg-green-500 rounded-lg shadow-sm">
                <FontAwesome6 name="phone" size={12} color="white" />
                <Text className="ml-2 text-sm font-semibold text-white">Call</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.8} onPress={handleOpenAssignDriverSheet} className="py-4 bg-blue-600 rounded-xl">
              <View className="flex-row items-center justify-center">
                <FontAwesome6 name="truck-fast" size={18} color="white" />
                <Text className="ml-2 text-lg font-bold text-white">Change Driver</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View className="p-6 m-6 border border-blue-200 bg-blue-50 rounded-xl">
            <Text className="mb-3 text-base font-semibold text-blue-800">Driver assigned for delivery</Text>

            <View className="flex-row items-center justify-between p-4 bg-blue-100 rounded-lg">
              <View className="flex-row items-center flex-1">
                <FontAwesome6 name="user-check" size={20} color="#2563EB" />
                <Text className="flex-shrink ml-3 text-lg font-semibold text-blue-800" numberOfLines={1} ellipsizeMode="tail">
                  {request.driver_id.name}
                </Text>
              </View>

              <TouchableOpacity activeOpacity={0.8} onPress={() => driverContactSheetRef.current?.snapToIndex(0)} className="ml-4 flex-row items-center px-4 py-2.5 bg-green-500 rounded-lg shadow-sm">
                <FontAwesome6 name="phone" size={12} color="white" />
                <Text className="ml-2 text-sm font-semibold text-white">Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
    }

    return null;
  };

  const renderNegotiationHistory = () => (
    <View className="mx-6 mt-8 mb-6">
      <View className="flex-row items-center mb-6">
        <View className="mr-4 overflow-hidden rounded-xl">
          <LinearGradient colors={["#3B82F6", "#1D4ED8"]} className="items-center justify-center p-3.5">
            <FontAwesome6 name="clock-rotate-left" size={18} color="white" />
          </LinearGradient>
        </View>
        <Text className="text-xl font-bold text-gray-900">Negotiation History</Text>
      </View>

      <View className="relative">
        {/* Timeline line */}
        <View className="absolute left-6 top-0 bottom-8 w-0.5 bg-gray-200" />

        {request.history
          .slice()
          .reverse()
          .map((entry, index) => {
            const isYou = entry.by === userType;
            const actorName = isYou ? "You" : otherPartyName;
            const isLast = index === request.history.length - 1;

            return (
              <View key={index} className="relative mb-8">
                {/* Step indicator */}
                <View className={`absolute left-4 w-4 h-4 rounded-full border-2 border-white shadow-md ${isYou ? "bg-blue-500" : "bg-gray-400"}`} style={{ zIndex: 10 }} />

                {/* Card */}
                <View className="ml-12 bg-white border border-gray-200 rounded-xl">
                  <View className="p-6">
                    <View className="flex-row items-start gap-4">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${isYou ? "bg-blue-100" : "bg-gray-100"}`}>
                        <FontAwesome6 name={entry.by === "buyer" ? "cart-shopping" : "reply"} size={16} color={isYou ? "#3B82F6" : "#6B7280"} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-3">
                          <View>
                            <Text className={`font-bold text-base ${isYou ? "text-blue-600" : "text-gray-900"}`}>{entry.by === "buyer" ? "Initial Offer" : "Counter Offer"}</Text>
                            <Text className="text-sm text-gray-500">by {actorName}</Text>
                          </View>
                          <Text className="text-sm text-gray-400">{formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}</Text>
                        </View>

                        <View className="p-4 mb-3 border border-gray-100 bg-gray-50 rounded-xl">
                          <Text className="mb-2 text-2xl font-bold text-gray-900">₹{entry.proposal.price.toLocaleString("en-IN")}</Text>
                          <Text className="mb-3 text-base text-gray-600">
                            for {entry.proposal.quantity} {entry.proposal.unit.name}
                          </Text>

                          {/* Schedule Date */}
                          <View className="flex-row items-center mb-3">
                            <FontAwesome6 name="calendar" size={14} color="#6B7280" />
                            <Text className="ml-2 text-sm text-gray-600">{format(new Date(entry.proposal.schedule.date), "MMM d, yyyy 'at' h:mm a")}</Text>
                          </View>

                          {/* Comments */}
                          {entry.proposal.comments && (
                            <View className="pt-3 mt-3 border-t border-gray-200">
                              <Text className="text-sm text-gray-700">"{entry.proposal.comments}"</Text>
                            </View>
                          )}
                        </View>

                        {/* Attachments */}
                        {entry.proposal.attachments?.length > 0 && (
                          <View className="mt-3">
                            <Text className="mb-1 text-sm font-semibold text-gray-900">Attachments ({entry.proposal.attachments.length})</Text>
                            {entry.proposal.attachments.map((file, fileIndex) => (
                              <TouchableOpacity activeOpacity={0.8} key={fileIndex} onPress={() => handleViewDocument(file)} className="flex-row items-center p-3 mt-2 border border-gray-200 bg-gray-50 rounded-xl">
                                <View className="items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                                  <FontAwesome6 name={file.url?.toLowerCase().includes(".pdf") ? "file-pdf" : "image"} size={14} color={file.url?.toLowerCase().includes(".pdf") ? "#DC2626" : "#10B981"} />
                                </View>
                                <View className="flex-1 ml-3">
                                  <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                                    {file.caption || "Document"}
                                  </Text>
                                  <Text className="text-xs text-gray-500">{file.url?.toLowerCase().includes(".pdf") ? "PDF" : "Image"} • Tap to view</Text>
                                </View>
                                {/* <FontAwesome6 name="eye" size={14} color="#2563EB" /> */}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );

  // --- Main JSX Return ---
  return (
    <View style={styles.flexOne}>
      {/* --- Header --- */}
      <View style={{ paddingTop: insets.top }} className="bg-white">
        <View className="flex-row items-center justify-between p-6 pt-4 pb-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Material Request</Text>
          <View className="w-12 h-12" />
        </View>
      </View>

      <View className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false} style={styles.flexOne} contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
          <View className="flex-row items-center justify-center ga-4">
            {renderStatusBadge()}
            {request?.trip_id ? renderTripDetailButton() : null}
          </View>

          {/* --- Material Card --- */}
          <View className="p-6 m-6 bg-white border border-gray-200 rounded-xl">
            <View className="flex-row items-start justify-between mb-6">
              <View className="flex-1">
                <Text className="mb-2 text-2xl font-bold text-gray-900">{request.material_id.name}</Text>
                <Text className="text-base text-gray-600">
                  ₹{Math.round(agreement.price / agreement.quantity).toLocaleString("en-IN")} per {agreement.unit.name}
                </Text>
              </View>
              {/* <View className="items-center justify-center w-16 h-16 bg-gray-100 rounded-xl"> */}
              <TouchableOpacity activeOpacity={0.8} onPress={() => mineContactSheetRef.current?.snapToIndex(0)} className="ml-4 flex-row items-center px-4 py-2.5 bg-green-500 rounded-lg shadow-sm">
                <FontAwesome6 name="phone" size={12} color="white" />
                <Text className="ml-2 text-sm font-semibold text-white">Call</Text>
              </TouchableOpacity>
              {/* </View> */}
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 p-4 border border-gray-200 bg-gray-50 rounded-xl">
                <Text className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Quantity</Text>
                <Text className="text-2xl font-bold text-gray-900">{agreement.quantity.toLocaleString("en-IN")}</Text>
                <Text className="text-sm text-gray-600">
                  {agreement.unit.name}
                  {agreement.quantity > 1 ? "s" : ""}
                </Text>
              </View>
              <View className="flex-1 p-4 border border-blue-200 bg-blue-50 rounded-xl">
                <Text className="mb-2 text-xs font-bold tracking-wide text-gray-500 uppercase">Total Value</Text>
                {agreement?.delivery_charge ? (
                  <>
                    <Text className="text-2xl font-bold text-blue-600">₹{(agreement.price + agreement.delivery_charge).toLocaleString("en-IN")}</Text>
                    <Text className="text-sm font-medium text-slate-500">+{agreement.delivery_charge.toLocaleString("en-IN")} Delivery Charges Included</Text>
                  </>
                ) : (
                  <Text className="text-2xl font-bold text-blue-600">₹{agreement.price.toLocaleString("en-IN")}</Text>
                )}
              </View>
            </View>

            <View className="pt-6 border-t border-gray-100">
              <View className="flex-row items-start gap-4">
                <View className={`items-center justify-center flex-shrink-0 w-12 h-12 mr-4 rounded-xl ${isDelivery ? "bg-blue-100" : "bg-green-100"}`}>
                  <FontAwesome6 name={isDelivery ? "truck" : "warehouse"} size={20} color={isDelivery ? "#3B82F6" : "#10B981"} />
                </View>
                <View className="flex-1">
                  <Text className="mb-2 text-lg font-bold text-gray-900">{isDelivery ? "Delivery Location" : "Pickup Location"}</Text>
                  <Text className="mb-3 text-base leading-relaxed text-gray-600">{isDelivery ? agreement.delivery_location?.address : request.mine_id.location.address}</Text>
                  <GetDirectionsButton startLocation={request.mine_id.location} endLocation={isDelivery ? agreement.delivery_location : request.mine_id.location} />
                </View>
              </View>
            </View>
          </View>

          <View className="flex-1">{renderActionPanel()}</View>

          {/* --- Proposal Details Card --- */}
          <View className="mx-6 mb-6">
            <View className="p-6 bg-white border border-gray-200 rounded-xl">
              <View className="flex-row items-center mb-4">
                <View className="mr-4 overflow-hidden rounded-xl">
                  <LinearGradient colors={["#10B981", "#059669"]} className="items-center justify-center p-3 px-4">
                    <FontAwesome6 name="clipboard-list" size={18} color="white" />
                  </LinearGradient>
                </View>
                <Text className="text-xl font-bold text-gray-900">Proposal Details</Text>
              </View>

              {/* horizontal line */}

              <View className="h-px mb-8 bg-gray-200" />

              <View className="flex gap-6">
                <View className="flex-row items-start gap-4">
                  <View className="items-center justify-center p-2.5 bg-blue-100 rounded-xl">
                    <FontAwesome6 name="calendar" size={16} color="#3B82F6" />
                  </View>
                  <View className="flex-1">
                    <Text className="mt-0.5 mb-1 text-sm font-bold tracking-wide text-gray-500 uppercase">Delivery Schedule</Text>
                    <Text className="text-lg font-semibold text-gray-900">{format(new Date(agreement.schedule.date), "EEEE, MMMM d, yyyy")}</Text>
                    <Text className="text-base text-gray-600">{format(new Date(agreement.schedule.date), "h:mm a")}</Text>
                  </View>
                </View>

                {/* pricing info including delivery charges if delivery charges exist */}
                <View className="flex-row items-start gap-4">
                  <View className="items-center justify-center p-2.5 bg-cyan-100 rounded-xl">
                    <FontAwesome6 name="money-bill-wave" size={16} color="#3B82F3" />
                  </View>
                  <View className="flex-1">
                    <Text className="mt-0.5 mb-1 text-sm font-bold tracking-wide text-gray-500 uppercase">Pricing Details</Text>
                    <Text className="text-lg font-semibold text-gray-900">₹{agreement.price.toLocaleString("en-IN")}</Text>
                    {agreement?.delivery_charge ? <Text className="text-base text-gray-600">+ ₹{agreement.delivery_charge.toLocaleString("en-IN")} Delivery Charges</Text> : null}
                  </View>
                </View>

                {agreement.comments && (
                  <View className="flex-row items-start gap-4">
                    <View className="items-center justify-center w-10 h-10 bg-green-100 rounded-xl">
                      <FontAwesome6 name="comment" size={16} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-sm font-bold tracking-wide text-gray-500 uppercase">Comments</Text>
                      <Text className="text-base leading-relaxed text-gray-900">{agreement.comments}</Text>
                    </View>
                  </View>
                )}

                <View className="flex-1">
                  {agreement.attachments?.length > 0 && (
                    <View className="flex-row items-start gap-4">
                      <View className="items-center justify-center w-10 h-10 bg-purple-100 rounded-xl">
                        <FontAwesome6 name="paperclip" size={16} color="#8B5CF6" />
                      </View>
                      <View className="flex-1">
                        <Text className="mb-3 text-sm font-bold tracking-wide text-gray-500 uppercase">Attachments</Text>
                        {agreement.attachments.map((file, index) => (
                          <TouchableOpacity activeOpacity={0.8} key={index} onPress={() => handleViewDocument(file)} className="flex-row items-center p-4 mt-2 border border-gray-200 bg-gray-50 rounded-xl">
                            <View className="items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                              <FontAwesome6 name={file.url?.toLowerCase().includes(".pdf") ? "file-pdf" : "image"} size={18} color={file.url?.toLowerCase().includes(".pdf") ? "#DC2626" : "#10B981"} />
                            </View>
                            <View className="flex-1 ml-4">
                              <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                                {file.caption || "Document"}
                              </Text>
                              <Text className="text-sm text-gray-500">{file.url?.toLowerCase().includes(".pdf") ? "PDF" : "Image"} • Tap to view</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View className="flex-1">{request.history?.length > 0 && renderNegotiationHistory()}</View>

          <Modal transparent={true} visible={isConfirmationModalVisible} animationType="fade" onRequestClose={() => setConfirmationModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <View className="w-11/12 max-w-md mx-4 bg-white rounded-2xl">
                <View className="p-6">
                  <View className="items-center mb-6">
                    <View className="items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-full">
                      <FontAwesome6 name="handshake" size={24} color="#10B981" />
                    </View>
                    <Text className="text-2xl font-bold text-center text-gray-900">Confirm Agreement</Text>
                    <Text className="mt-2 text-center text-gray-600">Review the final details before accepting</Text>
                  </View>

                  <View className="p-6 mb-6 border border-gray-200 bg-gray-50 rounded-xl">
                    <DetailRow icon="user" label="Buyer" value={request.truck_owner_id.name} iconColor="#10B981" />
                     {request.current_proposal.delivery_charge  ? <DetailRow icon="indian-rupee-sign" label="Final Price" value={`₹${(request.current_proposal.price + request.current_proposal.delivery_charge).toLocaleString("en-IN")} for ${request.current_proposal.quantity} ${request.current_proposal.unit.name}`} iconColor="#F59E0B" /> : <DetailRow icon="indian-rupee-sign" label="Final Price" value={`₹${(request.current_proposal.price).toLocaleString("en-IN")} for ${request.current_proposal.quantity} ${request.current_proposal.unit.name}`} iconColor="#F59E0B" />}
                {/* {request.current_proposal.delivery_charge ? <Text className="text-sm font-medium text-slate-500">This includes ₹{request.current_proposal.delivery_charge.toLocaleString("en-IN")} Delivery Charges</Text> : null} */}
              
                    <DetailRow icon="calendar-alt" label="Schedule" value={format(new Date(request.current_proposal.schedule.date), "EEE, MMM d, yyyy 'at' h:mm a")} iconColor="#3B82F6" />
                    {confirmationDetails?.driver && (
                      <>
                        <View className="h-px my-4 bg-gray-200" />
                        <DetailRow icon="user-check" label="Assigned Driver" value={confirmationDetails.driver.name} iconColor="#8B5CF6" />
                        <DetailRow icon="truck" label="Vehicle" value={`${confirmationDetails.driver.truck.name} (${confirmationDetails.driver.truck.reg})`} iconColor="#3B82F6" />
                      </>
                    )}
                  </View>

                  <View className="flex gap-3">
                    <TouchableOpacity activeOpacity={0.8} onPress={executeAcceptance} disabled={isProcessing} className="py-4 bg-green-500 rounded-xl">
                      {isProcessing ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <Feather name="check" size={18} color="white" />
                          <Text className="ml-2 text-lg font-bold text-white">Accept Offer</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => setConfirmationModalVisible(false)} className="py-4 bg-gray-100 rounded-xl">
                      <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>

          {/* Document Viewer Modal */}
          <DocumentViewer visible={documentViewer.visible} onClose={() => setDocumentViewer({ visible: false, document: null })} document={documentViewer.document} />
        </ScrollView>
      </View>

      {/* Driver Contact Bottom Sheet */}
      <ReusableBottomSheet ref={driverContactSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-indigo-100 rounded-full">
              <Feather name="phone" size={28} color="#6366F1" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Driver</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with the driver for trip updates</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Driver Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{request?.driver_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{request?.driver_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleCallPress(request?.driver_id?.phone)} disabled={!request?.driver_id?.phone} className={`flex-row items-center justify-center p-4 rounded-2xl ${!request?.driver_id?.phone ? "bg-gray-200" : "bg-indigo-500"}`}>
              <FontAwesome6 name="phone" size={18} color={!request?.driver_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!request?.driver_id?.phone ? "text-gray-500" : "text-white"}`}>{!request?.driver_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => driverContactSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={mineContactSheetRef} enablePanDownToClose={true} backgroundStyle={{ backgroundColor: "#fff" }} handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}>
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 bg-blue-100 rounded-full">
              <Feather name="phone" size={28} color="#3B82F6" />
            </View>
            <Text className="mb-3 text-2xl font-bold text-center text-gray-900">Contact Mine Owner</Text>
            <Text className="text-center text-gray-600 text-md">Get in touch with the mine owner for inquiries</Text>
          </View>
          <View className="mb-8">
            <View className="p-4 bg-gray-50 rounded-2xl">
              <View className="flex-row items-center mb-3">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="user" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Owner Name</Text>
                  <Text className="text-lg font-semibold text-gray-900">{request?.mine_id?.owner_id?.name || "Not available"}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="p-2 mr-3 bg-white rounded-full">
                  <Feather name="phone" size={16} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">Phone Number</Text>
                  <Text className="text-lg font-semibold text-gray-900">{request?.mine_id?.owner_id?.phone || "Not available"}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="gap-4 mt-auto">
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleCallPress(request?.mine_id?.owner_id?.phone)} disabled={!request?.mine_id?.owner_id?.phone} className={`flex-row items-center justify-center p-4 rounded-2xl ${!request?.mine_id?.owner_id?.phone ? "bg-gray-200" : "bg-blue-500"}`}>
              <FontAwesome6 name="phone" size={18} color={!request?.mine_id?.owner_id?.phone ? "#9CA3AF" : "#ffffff"} solid />
              <Text className={`ml-2 text-lg font-bold ${!request?.mine_id?.owner_id?.phone ? "text-gray-500" : "text-white"}`}>{!request?.mine_id?.owner_id?.phone ? "Phone Not Available" : "Call Now"}</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => mineContactSheetRef.current?.close()} className="p-4 bg-gray-100 rounded-2xl">
              <Text className="text-lg font-bold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={acceptBottomSheetRef}>
        <>
          {!isDelivery ? (
            <View className="flex-1 p-6">
              <View className="items-center mb-6">
                <View className="items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-2xl">
                  <FontAwesome6 name="user-plus" size={24} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-center text-gray-900">Assign a Driver</Text>
                <Text className="mt-2 text-base text-center text-gray-600">Select an available driver for this delivery</Text>
              </View>

              {isLoadingDrivers ? (
                <View className="items-center justify-center flex-1">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="mt-4 text-gray-600">Loading drivers...</Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  {assignableDrivers?.length > 0 ? (
                    assignableDrivers.map((item) => <DriverCard key={item._id} driver={item} isSelected={selectedDriverId === item._id} onSelect={setSelectedDriverId} requestScheduleDate={request.current_proposal.schedule.date} />)
                  ) : (
                    <View className="items-center justify-center p-8">
                      <FontAwesome6 name="users-slash" size={48} color="#9CA3AF" />
                      <Text className="mt-4 text-center text-gray-500">No registered drivers with trucks available</Text>
                    </View>
                  )}
                </ScrollView>
              )}

              <View className="pt-6 mt-auto space-y-4 border-t border-gray-200">
                <TouchableOpacity activeOpacity={0.8} onPress={() => handleAcceptanceFlow({})} disabled={isProcessing || !selectedDriverId} className={`py-4 rounded-xl ${selectedDriverId ? "bg-green-500" : "bg-gray-300"}`}>
                  {isProcessing && selectedDriverId ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center justify-center">
                      <Feather name="check" size={20} color="white" />
                      <Text className="ml-2 text-lg font-bold text-white">Confirm & Assign</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={() => handleAcceptanceFlow({ assignLater: true })} disabled={isProcessing} className="py-4 bg-white border-2 border-gray-300 rounded-xl">
                  <Text className="text-lg font-bold text-center text-gray-800">Assign Driver Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-1 p-6">
              <View className="items-center mb-6">
                <View className="items-center justify-center w-16 h-16 mb-4 bg-green-100 rounded-2xl">
                  <FontAwesome6 name="handshake" size={24} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-center text-gray-900">Accept this Offer?</Text>
                <Text className="mt-2 text-base text-center text-gray-600">This will finalize the agreement. This action cannot be undone.</Text>
              </View>

              <View className="p-6 mb-6 border border-gray-200 bg-gray-50 rounded-xl">
                <DetailRow icon="user" label="Buyer" value={request.truck_owner_id.name} iconColor="#10B981" />

                {request.current_proposal.delivery_charge  ? <DetailRow icon="indian-rupee-sign" label="Final Price" value={`₹${(request.current_proposal.price + request.current_proposal.delivery_charge).toLocaleString("en-IN")} for ${request.current_proposal.quantity} ${request.current_proposal.unit.name}`} iconColor="#F59E0B" /> : <DetailRow icon="indian-rupee-sign" label="Final Price" value={`₹${(request.current_proposal.price).toLocaleString("en-IN")} for ${request.current_proposal.quantity} ${request.current_proposal.unit.name}`} iconColor="#F59E0B" />}
                {request.current_proposal.delivery_charge ? <Text className="mt-1 text-sm font-medium text-slate-500">This includes {'\n'}₹{request.current_proposal.delivery_charge.toLocaleString("en-IN")} Delivery Charges</Text> : null}
              </View>

              <View className="pt-6 mt-auto space-y-4 border-t border-gray-200">
                <TouchableOpacity activeOpacity={0.8} onPress={() => handleAcceptanceFlow({})} disabled={isProcessing} className="py-4 bg-green-500 rounded-xl">
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View className="flex-row items-center justify-center">
                      <Feather name="check" size={20} color="white" />
                      <Text className="ml-2 text-lg font-bold text-white">Confirm & Accept</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} onPress={handleCloseAcceptSheet} className="py-4 mt-4 bg-white border-2 border-gray-300 rounded-xl">
                  <Text className="text-lg font-bold text-center text-gray-800">Go Back</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={rejectBottomSheetRef}>
        <View className="flex-1 p-6">
          <View className="items-center mb-6">
            <View className="items-center justify-center w-16 h-16 mb-4 bg-red-100 rounded-2xl">
              <FontAwesome6 name="house-circle-xmark" size={24} color="#EF4444" />
            </View>
            <Text className="text-2xl font-bold text-center text-gray-900">Reject Request</Text>
            <Text className="mt-2 text-base text-center text-gray-600">Please provide a reason for rejecting this request</Text>
          </View>

          <Text className="mb-4 text-lg font-bold text-gray-800">Select a reason</Text>
          <View className="flex-row flex-wrap mb-6">
            {REJECTION_REASONS.map((reason) => (
              <TouchableOpacity activeOpacity={0.8} key={reason} onPress={() => setRejectionReason(reason)} className={`px-4 py-3 mr-1 mb-3 border-2 rounded-xl ${rejectionReason === reason ? "bg-red-500 border-red-500" : "bg-white border-gray-200"}`}>
                <Text className={`font-semibold ${rejectionReason === reason ? "text-white" : "text-gray-700"}`}>{reason}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="mb-4 text-lg font-bold text-gray-800">Or specify another reason</Text>
          <TextInput placeholder="e.g., Unable to fulfill the order at this time..." value={customReason} onChangeText={setCustomReason} className="p-4 mb-6 text-base border-2 border-gray-200 bg-gray-50 rounded-xl" style={{ height: 120 }} textAlignVertical="top" multiline />

          <View className="flex gap-4 pt-6 mt-auto border-t border-gray-200">
            <TouchableOpacity activeOpacity={0.8} onPress={handleReject} disabled={isProcessing} className="py-4 bg-red-500 rounded-xl">
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <FontAwesome6 name="circle-xmark" size={18} color="white" solid />
                  <Text className="ml-2 text-lg font-bold text-white">Reject Request</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCloseRejectSheet} className="py-4 bg-white border-2 border-gray-300 rounded-xl">
              <Text className="text-lg font-bold text-center text-gray-800">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>

      <ReusableBottomSheet ref={assignDriverSheetRef}>
        <View className="flex-1 p-6">
          <View className="items-center mb-6">
            <View className="items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-2xl">
              <FontAwesome6 name="truck-fast" size={24} color="#3B82F6" />
            </View>
            <Text className="text-2xl font-bold text-center text-gray-900">Assign or Change Driver</Text>
            <Text className="mt-2 text-base text-center text-gray-600">Select an available driver for this trip</Text>
          </View>

          {isLoadingDrivers ? (
            <View className="items-center justify-center flex-1">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-4 text-gray-600">Loading drivers...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              {availableDriversForChange?.length > 0 ? (
                availableDriversForChange.map((item) => <DriverCard key={item._id} driver={item} isSelected={selectedDriverId === item._id} onSelect={setSelectedDriverId} requestScheduleDate={(request.finalized_agreement || request.current_proposal).schedule.date} />)
              ) : (
                <View className="items-center justify-center p-8">
                  <FontAwesome6 name="users-slash" size={48} color="#9CA3AF" />
                  <Text className="mt-4 text-center text-gray-500">No other drivers available for this date</Text>
                </View>
              )}
            </ScrollView>
          )}

          <View className="pt-6 mt-auto space-y-4 border-t border-gray-200">
            <TouchableOpacity activeOpacity={0.8} onPress={handleConfirmAssignDriver} disabled={isAssigning || !selectedDriverId} className={`py-4 mb-4 rounded-xl ${selectedDriverId ? "bg-blue-500" : "bg-gray-300"}`}>
              {isAssigning ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Feather name="check" size={20} color="white" />
                  <Text className="ml-2 text-lg font-bold text-white">Confirm & Assign Driver</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleCloseAssignDriverSheet} className="py-4 bg-white border-2 border-gray-300 rounded-xl">
              <Text className="text-lg font-bold text-center text-gray-800">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </View>
  );
};

// --- Enhanced Styles ---
const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  documentViewerContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});

export default RequestDetailScreen;
