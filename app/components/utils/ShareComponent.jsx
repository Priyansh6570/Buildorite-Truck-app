import React, { useState, useRef, useImperativeHandle } from "react";
import { View, Text, TouchableOpacity, Image, Share, Modal, ScrollView } from "react-native";
import ReusableBottomSheet from "../Ui/ReusableBottomSheet";
import Feather from "@expo/vector-icons/Feather";
import MaterialDesignIcons from "@expo/vector-icons/MaterialCommunityIcons";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-toast-message";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Dark Theme Card Component
const DarkThemeCard = React.forwardRef(({ data }, ref) => {
  const imageUrl = data?.imageUrl || "https://placehold.co/600x400/e2e8f0/e2e8f0?text=Image";
  const initials = data?.ownerName
    ? data.ownerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "UN";

  return (
    <View className="absolute -top-[15000px] left-0 -z-10">
      <ViewShot ref={ref} options={{ fileName: "buildorite-mine-card-dark", format: "png", quality: 1.0 }}>
        <View className="w-[300px] bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-600">
          <View className="relative h-48">
            <Image source={{ uri: imageUrl }} className="z-10 w-full h-full" style={{ resizeMode: "cover" }} />

            <View className="absolute z-20 top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
              <Text className="text-xs font-semibold tracking-wider text-white">MINING OPERATION</Text>
            </View>

            <View className="absolute z-20 items-center justify-center w-10 h-10 border rounded-full top-4 right-4 bg-white/20 backdrop-blur-sm border-white/30">
              <MaterialIcons name="terrain" size={20} color="white" />
            </View>
          </View>

          <LinearGradient colors={["#10192B", "#10192B"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} className="">
            <View className="p-6">
              <View className="mb-4">
                <Text className="mb-2 ml-1 text-xl font-bold text-white">{data?.name || "Mining Site"}</Text>
                {data?.location && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="location-on" size={16} color="#FFA500" />
                    <Text className="ml-2 text-sm text-gray-300">{data.location}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-between w-full pt-4 border-t border-slate-700">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-10 h-10 mr-3 bg-orange-500 rounded-full">
                    <Text className="text-sm font-bold text-white">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-white">{data?.ownerName || "Unknown Owner"}</Text>
                    <Text className="text-xs text-gray-400">Mine Owner</Text>
                  </View>
                </View>
                <View className="">
                  <View className="flex-row items-center mb-1 -mt-3 -ml-20">
                    <MaterialIcons name="verified" size={16} color="#FFA500" />
                    <Text className="ml-1 text-xs font-medium text-[#FFA500]">Verified</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mx-6 my-4 overflow-hidden rounded-xl">
              <LinearGradient colors={["#FFA500", "#FF8C00"]} className="p-0.5 rounded-lg">
                <View className="items-center py-3 rounded-lg bg-[#10192B]">
                  <Text className="text-sm font-medium tracking-wider text-white">POWERED BY BUILDORITE</Text>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </ViewShot>
    </View>
  );
});

// Light Theme Card Component
const LightThemeCard = React.forwardRef(({ data }, ref) => {
  const imageUrl = data?.imageUrl || "https://placehold.co/600x400/e2e8f0/e2e8f0?text=Image";
  const initials = data?.ownerName
    ? data.ownerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "UN";

  return (
    <View className="absolute -top-[15000px] left-0 -z-10">
      <ViewShot ref={ref} options={{ fileName: "buildorite-mine-card-light", format: "png", quality: 1.0 }}>
        <View className="w-[300px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
          <View className="relative h-48">
            <Image source={{ uri: imageUrl }} className="z-10 w-full h-full" style={{ resizeMode: "cover" }} />

            <View className="absolute z-20 top-4 left-4 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
              <Text className="text-xs font-semibold tracking-wider text-white">MINING OPERATION</Text>
            </View>

            <View className="absolute z-20 items-center justify-center w-10 h-10 border rounded-full top-4 right-4 bg-white/20 backdrop-blur-sm border-white/30">
              <MaterialIcons name="terrain" size={20} color="white" />
            </View>
          </View>

          <LinearGradient colors={["#F8FAFC", "#F1F5F9"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} className="">
            <View className="p-6">
              <View className="mb-4">
                <Text className="mb-2 ml-1 text-xl font-bold text-gray-900">{data?.name || "Mining Site"}</Text>
                {data?.location && (
                  <View className="flex-row items-center">
                    <MaterialIcons name="location-on" size={16} color="#0EA5E9" />
                    <Text className="ml-2 text-xs text-gray-600">{data.location}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center justify-between w-full pt-4 border-t border-slate-200">
                <View className="flex-row items-center">
                  <View className="items-center justify-center w-10 h-10 mr-3 rounded-full bg-sky-500">
                    <Text className="text-sm font-bold text-white">{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-900">{data?.ownerName || "Unknown Owner"}</Text>
                    <Text className="text-xs text-gray-500">Mine Owner</Text>
                  </View>
                </View>
                <View className="">
                  <View className="flex-row items-center mb-1 -mt-3 -ml-20">
                    <MaterialIcons name="verified" size={16} color="#0EA5E9" />
                    <Text className="ml-1 text-xs font-medium text-[#0EA5E9]">Verified</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="mx-6 my-4 overflow-hidden rounded-xl">
              <LinearGradient colors={["#0EA5E9", "#0284C7"]} className="p-0.5 rounded-lg">
                <View className="items-center py-3 rounded-lg bg-[#F8FAFC]">
                  <Text className="text-sm font-medium tracking-wider text-sky-600">POWERED BY BUILDORITE</Text>
                </View>
              </LinearGradient>
            </View>
          </LinearGradient>
        </View>
      </ViewShot>
    </View>
  );
});

const ThemeSelectionModal = ({ visible, onClose, onSelectTheme, data }) => (
  <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
    <View className="items-center justify-center flex-1 bg-black/70">
      <View className="bg-white rounded-3xl p-6 w-[90%] max-h-[80%]">
        <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Choose Card Theme</Text>
        <Text className="mb-8 text-base text-center text-gray-500">Select your preferred card design</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mx-auto mb-6">
          {/* Dark Theme Preview */}
          <TouchableOpacity activeOpacity={1} className="items-center mx-3" onPress={() => onSelectTheme("dark")}>
            <View className="w-[140px] bg-slate-800 rounded-xl overflow-hidden shadow-lg mb-2">
              <View className="relative h-20">
                <Image source={{ uri: data?.imageUrl }} className="w-full h-full" style={{ resizeMode: "cover" }} />
                <View className="absolute inset-0 bg-black/30" />
                <View className="absolute top-2 left-2 bg-white/20 px-1.5 py-0.5 rounded-lg">
                  <Text className="text-white text-[8px] font-semibold">MINING</Text>
                </View>
              </View>
              <View className="p-3">
                <Text className="mb-2 text-xs font-bold text-white">{data?.name || "Mining Site"}</Text>
                <View className="pt-2 border-t border-gray-600">
                  <Text className="text-orange-500 text-[8px] font-medium text-center tracking-wider">BUILDORITE</Text>
                </View>
              </View>
            </View>
            <Text className="text-sm font-semibold text-center text-gray-700">Dark Theme</Text>
          </TouchableOpacity>

          {/* Light Theme Preview */}
          <TouchableOpacity activeOpacity={1} className="items-center mx-3" onPress={() => onSelectTheme("light")}>
            <View className="w-[140px] bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-2">
              <View className="relative h-20">
                <Image source={{ uri: data?.imageUrl }} className="w-full h-full" style={{ resizeMode: "cover" }} />
                <View className="absolute inset-0 bg-black/10" />
                <View className="absolute top-2 left-2 bg-indigo-600/90 px-1.5 py-0.5 rounded-lg">
                  <Text className="text-white text-[8px] font-semibold">MINING</Text>
                </View>
              </View>
              <View className="p-3">
                <Text className="mb-2 text-xs font-bold text-gray-900">{data?.name || "Mining Site"}</Text>
                <View className="pt-2 border-t border-gray-200">
                  <Text className="text-indigo-600 text-[8px] font-medium text-center tracking-wider">BUILDORITE</Text>
                </View>
              </View>
            </View>
            <Text className="text-sm font-semibold text-center text-gray-700">Light Theme</Text>
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity className="px-6 py-3.5 bg-gray-100 rounded-xl" onPress={onClose}>
          <Text className="text-base font-semibold text-center text-gray-500">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const ShareComponent = React.forwardRef(({ shareableData }, ref) => {
  const bottomSheetRef = useRef(null);
  const darkCardRef = useRef(null);
  const lightCardRef = useRef(null);
  const [showThemeModal, setShowThemeModal] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => {
      if (bottomSheetRef.current) {
        bottomSheetRef.current.snapToIndex(0);
      }
    },
  }));

  if (!shareableData || !shareableData.path) {
    return null;
  }

  const redirectorUrl = `https://buildorite.pages.dev/${shareableData.path}?app=${shareableData.app}`;

  // Enhanced Professional Sharing Logic
  const shareWithDeepLink = async () => {
    try {
      const mineName = shareableData.name || "Mining Operation";
      const location = shareableData.location || "Not specified";
      const ownerName = shareableData.ownerName || "";

      let shareContent = `${mineName}\n\n`;
      shareContent += `Location \n${location}\n\n`;
      if (ownerName) shareContent += `Owner \n${ownerName}\n\n`;
      shareContent += `Access comprehensive operational details:\n${redirectorUrl}\n\n`;
      shareContent += `Powered by Buildorite`;

      await Share.share({
        message: shareContent,
        title: `${mineName} - Mining Details`,
        url: redirectorUrl,
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Sharing Failed", text2: "Unable to share content at this time" });
    }
  };

  const handleCardShare = () => {
    setShowThemeModal(true);
  };

  const shareCardWithTheme = async (theme) => {
    try {
      setShowThemeModal(false);
      const cardRef = theme === "dark" ? darkCardRef : lightCardRef;
      const uri = await cardRef.current.capture();

      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({ type: "error", text1: "Sharing Unavailable", text2: "Sharing is not supported on this device." });
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `Share ${shareableData.name || "Mining Site"} Card`,
        UTI: "public.png",
      });

      bottomSheetRef.current?.close();
    } catch (error) {
      Toast.show({ type: "error", text1: "Card Generation Failed", text2: "Unable to create shareable card" });
    }
  };

  const copyToClipboard = () => {
    try {
      const mineName = shareableData.name || "Not specified";
      const location = shareableData.location || "Not specified";
      const ownerName = shareableData.ownerName || "Not specified";

      let clipboardContent = `=== MINING SITE DETAILS ===\n\n`;
      clipboardContent += `Site Name: ${mineName}\n`;
      clipboardContent += `Location: ${location}\n`;
      clipboardContent += `Owner: ${ownerName}\n\n`;
      clipboardContent += `--- ACCESS LINK ---\n${redirectorUrl}`;

      Clipboard.setString(clipboardContent);
      Toast.show({
        type: "success",
        text1: "Details Copied Successfully",
        text2: "Professional format copied to clipboard",
      });
    } catch (error) {
      Toast.show({ type: "error", text1: "Copy Failed", text2: "Unable to copy details to clipboard" });
    }
  };

  return (
    <>
      {/* Hidden card components */}
      <DarkThemeCard data={shareableData} ref={darkCardRef} />
      <LightThemeCard data={shareableData} ref={lightCardRef} />

      {/* Enhanced Bottom Sheet */}
      <ReusableBottomSheet ref={bottomSheetRef} enablePanDownToClose={true}>
        {/* Theme Selection Modal */}
        <ThemeSelectionModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} onSelectTheme={shareCardWithTheme} data={shareableData} />
        <View className="flex-1 p-6">
          <View className="items-center mb-8">
            <View className="p-4 mb-6 rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
              <MaterialDesignIcons name="share-variant" size={32} color="#7C3AED" />
            </View>
            <Text className="mb-2 text-2xl font-bold text-center text-gray-900">Share Mining Details</Text>
            <Text className="px-4 text-base text-center text-gray-600">Choose your preferred sharing method for professional distribution</Text>
          </View>

          <View className="gap-3">
            <TouchableOpacity
              onPress={() => {
                shareWithDeepLink();
                bottomSheetRef.current?.close();
              }}
              className="flex-row items-center p-5 border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl"
            >
              <View className="p-3 mr-4 bg-blue-500 rounded-xl">
                <Feather name="link-2" size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Professional Link</Text>
                <Text className="text-sm text-gray-600">Share formatted details with secure access link</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCardShare} className="flex-row items-center p-5 border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <View className="p-3 mr-4 bg-green-500 rounded-xl">
                <MaterialIcons name="image" size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Visual Card</Text>
                <Text className="text-sm text-gray-600">Create professional branded image card</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                copyToClipboard();
                bottomSheetRef.current?.close();
              }}
              className="flex-row items-center p-5 border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl"
            >
              <View className="p-3 mr-4 bg-purple-500 rounded-xl">
                <MaterialIcons name="content-copy" size={22} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">Copy Details</Text>
                <Text className="text-sm text-gray-600">Formatted text for manual distribution</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()} className="p-4 mt-6 bg-gray-100 border border-gray-200 rounded-2xl">
              <Text className="text-lg font-semibold text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReusableBottomSheet>
    </>
  );
});

export default ShareComponent;
