import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking, Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome6, Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import { LinearGradient } from "expo-linear-gradient";

const NavigationPath = ({ steps }) => (
  <View className="p-4 my-3 border border-blue-200 bg-blue-50 rounded-xl">
    <View className="flex-row items-center mb-2">
      <Ionicons name="navigate" size={16} color="#3b82f6" />
      <Text className="ml-2 text-sm font-semibold text-blue-900">Navigation Path:</Text>
    </View>
    <View className="flex-row flex-wrap items-center">
      {steps.map((step, index) => (
        <View key={index} className="flex-row items-center mb-4">
          <View className="px-3 py-1 bg-blue-100 rounded-lg">
            <Text className="text-sm font-medium text-blue-800">{step}</Text>
          </View>
          {index < steps.length - 1 && <Ionicons name="chevron-forward" size={16} color="#60a5fa" className="mx-2" />}
        </View>
      ))}
    </View>
  </View>
);

const StepByStep = ({ steps, title }) => (
  <View className="p-4 my-3 border border-green-200 bg-green-50 rounded-xl">
    <View className="flex-row items-center mb-3">
      <Ionicons name="list" size={16} color="#16a34a" />
      <Text className="ml-2 text-sm font-semibold text-green-900">{title}:</Text>
    </View>
    {steps.map((step, index) => (
      <View key={index} className="flex-row items-start mb-2">
        <View className="items-center justify-center w-6 h-6 mr-3 bg-green-200 rounded-full">
          <Text className="text-xs font-bold text-green-800">{index + 1}</Text>
        </View>
        <Text className="flex-1 text-sm text-green-800">{step}</Text>
      </View>
    ))}
  </View>
);

const PermissionItem = ({ icon, title, description, color, important }) => (
  <View className="flex-row items-start p-3 mb-3 bg-white border border-gray-200 rounded-xl">
    <View className="items-center justify-center w-10 h-10 mr-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View className="flex-1">
      <View className="flex-row items-center">
        <Text className="font-semibold text-gray-900">{title}</Text>
        {important && (
          <View className="px-2 py-1 ml-2 bg-red-100 rounded-full">
            <Text className="text-xs font-bold text-red-700">REQUIRED</Text>
          </View>
        )}
      </View>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
  </View>
);

const DriverTripFlow = () => {
  const stages = [
    {
      stage: "Trip Assigned",
      description: "You receive trip assignment notification",
      icon: "person-add",
      action: "view",
      canNavigate: false,
    },
    {
      stage: "Trip Started",
      description: "You update status and begin journey to pickup",
      icon: "play",
      action: "update",
      canNavigate: "mine",
      yourAction: true,
    },
    {
      stage: "Arrived at Pickup",
      description: "You mark arrival at mine location",
      icon: "location",
      action: "update",
      canNavigate: "mine",
      yourAction: true,
    },
    {
      stage: "Loading Complete",
      description: "You confirm materials loaded onto vehicle",
      icon: "cube",
      action: "update",
      canNavigate: "mine",
      yourAction: true,
    },
    {
      stage: "Pickup Verified",
      description: "Mine owner verifies quantity & quality",
      icon: "checkmark-circle",
      action: "wait",
      canNavigate: false,
    },
    {
      stage: "En Route to Delivery",
      description: "You update status and travel to destination",
      icon: "car",
      action: "update",
      canNavigate: "delivery",
      yourAction: true,
    },
    {
      stage: "Arrived at Delivery",
      description: "You mark arrival at delivery location",
      icon: "location-outline",
      action: "update",
      canNavigate: "delivery",
      yourAction: true,
    },
    {
      stage: "Delivery Complete",
      description: "You confirm materials unloaded successfully",
      icon: "download",
      action: "update",
      canNavigate: "delivery",
      yourAction: true,
    },
    {
      stage: "Delivery Verified",
      description: "Truck owner verifies successful delivery",
      icon: "checkmark-done",
      action: "wait",
      canNavigate: false,
    },
  ];

  return (
    <View className="p-4 my-3 border border-blue-200 bg-blue-50 rounded-xl">
      <View className="flex-row items-center mb-4">
        <Ionicons name="flag" size={16} color="#3b82f6" />
        <Text className="ml-2 text-sm font-semibold text-blue-900">Trip Journey (Driver Perspective):</Text>
      </View>

      {stages.map((item, index) => (
        <View key={index} className="flex-row items-start mb-3">
          <View className="items-center mr-3">
            <View className={`items-center justify-center w-10 h-10 rounded-full ${item.yourAction ? "bg-orange-200" : item.action === "wait" ? "bg-gray-200" : "bg-blue-200"}`}>
              <Ionicons name={item.icon} size={18} color={item.yourAction ? "#f97316" : item.action === "wait" ? "#6b7280" : "#3b82f6"} />
            </View>
            {index < stages.length - 1 && <View className="w-0.5 h-6 mt-1 bg-blue-300" />}
          </View>
          <View className="flex-1 pb-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="font-semibold text-blue-900">{item.stage}</Text>
              {item.yourAction && (
                <View className="px-2 py-1 bg-orange-100 rounded-full">
                  <Text className="text-xs font-bold text-orange-700">YOUR ACTION</Text>
                </View>
              )}
              {item.action === "wait" && (
                <View className="px-2 py-1 bg-gray-100 rounded-full">
                  <Text className="text-xs font-bold text-gray-700">WAIT</Text>
                </View>
              )}
              {item.canNavigate && (
                <View className="px-2 py-1 bg-green-100 rounded-full">
                  <Text className="text-xs font-bold text-green-700">NAV TO {item.canNavigate === "mine" ? "MINE" : "DELIVERY"}</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-blue-700">{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const TripCategories = () => (
  <View className="p-4 my-3 border border-purple-200 bg-purple-50 rounded-xl">
    <View className="flex-row items-center mb-3">
      <Ionicons name="layers" size={16} color="#a855f7" />
      <Text className="ml-2 text-sm font-semibold text-purple-900">Trip Categories:</Text>
    </View>

    <View className="space-y-3">
      <View className="flex-row items-start">
        <View className="items-center justify-center w-8 h-8 mr-3 bg-green-200 rounded-full">
          <Ionicons name="play-circle" size={16} color="#16a34a" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-purple-900">Active</Text>
          <Text className="text-sm text-purple-700">Current ongoing trip that requires your action</Text>
        </View>
      </View>

      <View className="flex-row items-start">
        <View className="items-center justify-center w-8 h-8 mr-3 bg-yellow-200 rounded-full">
          <Ionicons name="time" size={16} color="#d97706" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-purple-900">Scheduled</Text>
          <Text className="text-sm text-purple-700">Upcoming trips assigned to you</Text>
        </View>
      </View>

      <View className="flex-row items-start">
        <View className="items-center justify-center w-8 h-8 mr-3 bg-gray-200 rounded-full">
          <Ionicons name="library" size={16} color="#6b7280" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-purple-900">History</Text>
          <Text className="text-sm text-purple-700">Completed, canceled, and issue-reported trips</Text>
        </View>
      </View>
    </View>
  </View>
);

const IssueReportingFlow = () => (
  <View className="p-4 my-3 border border-red-200 bg-red-50 rounded-xl">
    <View className="flex-row items-center mb-3">
      <Ionicons name="warning" size={16} color="#dc2626" />
      <Text className="ml-2 text-sm font-semibold text-red-900">Issue Reporting Process:</Text>
    </View>

    <StepByStep
      title="How to Report Issues"
      steps={[
        "Go to Trip Details screen of the problematic trip",
        'Tap on "Report Issue" button in the trip detail section',
        "Select the most appropriate reason from available options",
        "Provide detailed notes about the situation",
        "Submit the issue report for review",
        "Wait for support team response and resolution",
      ]}
    />
  </View>
);

const DriverHelpScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);

  const helpSections = [
    {
      id: "getting-started",
      title: "Getting Started as Driver",
      icon: "rocket",
      color: "#3b82f6",
      bgColor: "#eff6ff",
      items: [
        {
          question: "How do I create a driver account?",
          answer: "Driver accounts are created by truck owners & mine owners who add you to their network. Once added, you'll receive an invitation to download the app and complete your profile setup.",
        },
        {
          question: "What permissions does the driver app need?",
          answer: "The driver app requires essential permissions for safe and efficient trip management:",
          component: (
            <View className="my-3">
              <PermissionItem icon="location" title="Location Permission (All Time)" description="Critical for live trip tracking, navigation assistance, and real-time location updates during active trips" color="#ef4444" important={true} />
              <PermissionItem icon="notifications" title="Notification Permission" description="Essential for receiving trip assignments, stage updates, and important communications from truck owners" color="#3b82f6" important={true} />
            </View>
          ),
        },
        {
          question: "How do I set up my profile?",
          answer: "Complete your driver profile by providing your name, email, phone number, and vehicle details including model and registration number. Keep this information updated for smooth trip operations.",
        },
      ],
    },
    {
      id: "trips-overview",
      title: "Understanding Trips",
      icon: "route",
      color: "#059669",
      bgColor: "#ecfdf5",
      items: [
        {
          question: "How are trips organized in the app?",
          answer: "Trips are organized into three main categories accessible from the Trips screen:",
          component: <TripCategories />,
        },
        {
          question: "How do I access my trips?",
          answer: "Access your trips through two main methods:",
          component: (
            <View className="p-4 my-3 border border-blue-200 bg-blue-50 rounded-xl">
              <View className="flex-row items-center mb-3">
                <Ionicons name="apps" size={16} color="#3b82f6" />
                <Text className="ml-2 text-sm font-semibold text-blue-900">Access Methods:</Text>
              </View>
              <View className="space-y-2">
                <Text className="mb-2 text-sm text-blue-800">
                  • <Text className="font-semibold">Bottom Tab Navigation:</Text> Use "Trips" tab for full trip management
                </Text>
                <Text className="text-sm text-blue-800">
                  • <Text className="font-semibold">Profile Screen:</Text> Quick access to assigned trips from your profile
                </Text>
              </View>
            </View>
          ),
        },
        {
          question: "What information is available in trip details?",
          answer: "Each trip details screen provides comprehensive information including pickup and delivery locations, materials information, truck owner details, current trip stage, navigation options, and action buttons for stage updates.",
        },
      ],
    },
    {
      id: "trip-management",
      title: "Trip Management & Stages",
      icon: "clipboard-list",
      color: "#dc2626",
      bgColor: "#fee2e2",
      items: [
        {
          question: "How do trip stages work for drivers?",
          answer: "Here's your complete journey from trip assignment to completion, including which stages you control:",
          component: <DriverTripFlow />,
        },
        {
          question: "Which trip stages can I update?",
          answer: "As a driver, you have control over specific stages of the trip:",
          component: (
            <View className="p-4 my-3 border border-orange-200 bg-orange-50 rounded-xl">
              <View className="flex-row items-center mb-3">
                <Ionicons name="hand-right" size={16} color="#ea580c" />
                <Text className="ml-2 text-sm font-semibold text-orange-900">Your Controllable Stages:</Text>
              </View>
              <View className="space-y-2">
                <Text className="mb-2 text-sm text-orange-800">
                  • <Text className="font-semibold">Trip Started:</Text> Mark when you begin journey to pickup
                </Text>
                <Text className="mb-2 text-sm text-orange-800">
                  • <Text className="font-semibold">Arrived at Pickup:</Text> Confirm arrival at mine location
                </Text>
                <Text className="mb-2 text-sm text-orange-800">
                  • <Text className="font-semibold">Loading Complete:</Text> Mark when materials are loaded
                </Text>
                <Text className="mb-2 text-sm text-orange-800">
                  • <Text className="font-semibold">En Route to Delivery:</Text> Start journey to destination
                </Text>
                <Text className="mb-2 text-sm text-orange-800">
                  • <Text className="font-semibold">Arrived at Delivery:</Text> Confirm arrival at delivery point
                </Text>
                <Text className="text-sm text-orange-800">
                  • <Text className="font-semibold">Delivery Complete:</Text> Mark when unloading is finished
                </Text>
              </View>
            </View>
          ),
        },
        {
          question: "When can I use navigation features?",
          answer: "Navigation to Google Maps is available during specific trip stages:",
          component: (
            <View className="p-4 my-3 border border-green-200 bg-green-50 rounded-xl">
              <View className="flex-row items-center mb-3">
                <Ionicons name="navigate-circle" size={16} color="#16a34a" />
                <Text className="ml-2 text-sm font-semibold text-green-900">Navigation Availability:</Text>
              </View>
              <View className="space-y-3">
                <View>
                  <Text className="mb-1 font-semibold text-green-900">🗺️ Navigation to Mine:</Text>
                  <Text className="text-sm text-green-800">Available during: Trip Started, Arrived at Pickup, Loading Complete</Text>
                </View>
                <View>
                  <Text className="mb-1 font-semibold text-green-900">🚚 Navigation to Delivery:</Text>
                  <Text className="text-sm text-green-800">Available during: Pickup Verified, En Route to Delivery, Arrived at Delivery, Delivery Complete</Text>
                </View>
              </View>
            </View>
          ),
        },
      ],
    },
    {
      id: "navigation",
      title: "Navigation & Directions",
      icon: "map-location-dot",
      color: "#7c3aed",
      bgColor: "#f3e8ff",
      items: [
        {
          question: "How do I use the navigation feature?",
          answer: "The navigation feature provides seamless integration with Google Maps:",
          component: (
            <StepByStep
              title="Using Navigation"
              steps={[
                "Open the trip details screen for your active trip",
                "Look for the Navigation section in the trip details",
                "Tap the appropriate direction button (Mine or Delivery)",
                "Google Maps will open automatically with the destination set",
                "Follow Google Maps directions to reach your destination",
              ]}
            />
          ),
        },
        {
          question: "When should I use navigation to mine vs delivery?",
          answer: 'The app intelligently shows the correct navigation option based on your current trip stage. During early stages, you\'ll see "Navigate to Mine" and during later stages, you\'ll see "Navigate to Delivery".',
        },
      ],
    },
    {
      id: "issue-reporting",
      title: "Issue Reporting",
      icon: "triangle-exclamation",
      color: "#dc2626",
      bgColor: "#fee2e2",
      items: [
        {
          question: "How do I report issues during a trip?",
          answer: "When problems occur during your trip, you can report them directly from the trip details:",
          component: <IssueReportingFlow />,
        },
        {
          question: "What types of issues can I report?",
          answer: "You can report various types of issues including vehicle breakdowns, loading/unloading problems, location access issues, weather-related delays, incorrect materials, and any other situations that prevent normal trip completion.",
        },
        {
          question: "What happens after I report an issue?",
          answer: "Once you submit an issue report, the support team and relevant parties (truck owner, mine owner) are notified. They will work to resolve the situation and provide guidance on how to proceed with the trip.",
        },
      ],
    },
    {
      id: "schedule",
      title: "Schedule Management",
      icon: "calendar",
      color: "#059669",
      bgColor: "#ecfdf5",
      items: [
        {
          question: "How do I view my trip schedule?",
          answer: "Access your trip schedule through your profile:",
          component: (
            <React.Fragment>
              <NavigationPath steps={["Profile", "Schedule"]} />
              <Text className="mt-2 text-sm text-gray-600">The Schedule screen displays a calendar view with highlighted dates showing different types of trips and their status.</Text>
            </React.Fragment>
          ),
        },
        {
          question: "How are scheduled trips displayed?",
          answer: "The calendar uses different colors and highlights to show various trip types, statuses, and important dates. This helps you plan your availability and prepare for upcoming trips.",
        },
        {
          question: "Can I see details of scheduled trips?",
          answer: "Yes, you can tap on any highlighted date in the calendar to view detailed information about trips scheduled for that day, including pickup times, locations, and materials.",
        },
      ],
    },
    {
      id: "account-vehicle",
      title: "Account & Vehicle Management",
      icon: "user-gear",
      color: "#4b5563",
      bgColor: "#f3f4f6",
      items: [
        {
          question: "How do I update my account information?",
          answer: "Keep your account information current through the settings:",
          component: (
            <React.Fragment>
              <NavigationPath steps={["Profile", "Settings", "Account"]} />
              <Text className="mt-2 text-sm text-gray-600">Update your name, email address, and phone number to ensure smooth communication with truck owners and support.</Text>
            </React.Fragment>
          ),
        },
        {
          question: "How do I update my vehicle details?",
          answer: "Vehicle information is crucial for trip assignments:",
          component: (
            <React.Fragment>
              <NavigationPath steps={["Profile", "Settings", "Vehicle"]} />
              <StepByStep title="Vehicle Details to Update" steps={["Vehicle model and make for identification", "Registration number for official documentation", "Ensure all details are accurate and up-to-date", "Save changes to update your profile"]} />
            </React.Fragment>
          ),
        },
        {
          question: "Why is accurate vehicle information important?",
          answer: "Accurate vehicle details help truck owners assign appropriate trips, ensure proper load capacity matching, assist in vehicle identification at pickup and delivery points, and maintain compliance with transportation regulations.",
        },
      ],
    },
  ];

  const filteredSections = helpSections.filter((section) => section.title.toLowerCase().includes(searchQuery.toLowerCase()) || section.items.some((item) => item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase())));

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const contactSupport = () => {
    const email = "support@buildorite.com";
    const subject = "Driver App Support Request";
    const deviceInfo = `${Device.brand || "Unknown"} ${Device.modelName || "Unknown"}`;
    const osVersion = `${Platform.OS} ${Platform.Version}`;
    const body = `Hello Support Team,

I need help with:

[Please describe your issue here]

App Version: 1.0.0 (Driver)
Device: ${deviceInfo}
OS: ${osVersion}

Thank you!`;

    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`).catch(() => {
      Alert.alert("Email Support", `Please contact us at: ${email}`, [{ text: "OK" }]);
    });
  };

  const makePhoneCall = () => {
    const phoneNumber = "8871558564";
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert("Phone Call", `Please call us at: ${phoneNumber}`, [{ text: "OK" }]);
    });
  };

  const showVideoMessage = () => {
    Alert.alert("Video Tutorials", "Video tutorials for drivers are not available yet. We're working on creating helpful video content for trip management and navigation!", [{ text: "OK" }]);
  };

  const showUserGuide = () => {
    Alert.alert("User Guide", "Comprehensive driver guide with detailed screenshots and step-by-step instructions coming soon!", [{ text: "OK" }]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View style={{ paddingTop: insets.top }} className="pb-4 bg-white shadow-lg">
        <View className="flex-row items-center justify-between p-6">
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} className="p-3 bg-gray-100 border border-slate-200 rounded-xl">
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Help & Support</Text>
          <TouchableOpacity onPress={contactSupport} activeOpacity={0.8} className="overflow-hidden rounded-xl">
            <LinearGradient colors={["#3b82f6", "#1d4ed8"]} className="p-3">
              <Ionicons name="mail" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View className="mx-6 mt-4">
          <View className="flex-row items-center px-4 py-3 bg-gray-100 rounded-xl">
            <Feather name="search" size={20} color="#6b7280" />
            <TextInput className="flex-1 ml-3 text-gray-800" placeholder="Search help topics..." placeholderTextColor="#9ca3af" value={searchQuery} onChangeText={setSearchQuery} />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-gray-900">Quick Actions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={makePhoneCall} className="flex-1 p-4 border border-green-200 bg-green-50 rounded-2xl">
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-green-100 rounded-full">
                    <Ionicons name="call" size={24} color="#16a34a" />
                  </View>
                  <Text className="text-sm font-semibold text-green-900">Call Support</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={showVideoMessage} className="flex-1 p-4 border border-blue-200 bg-blue-50 rounded-2xl">
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-blue-100 rounded-full">
                    <Feather name="video" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-sm font-semibold text-blue-900">Video Tutorials</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={showUserGuide} className="flex-1 p-4 border border-purple-200 bg-purple-50 rounded-2xl">
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-purple-100 rounded-full">
                    <Feather name="book-open" size={24} color="#a855f7" />
                  </View>
                  <Text className="text-sm font-semibold text-purple-900">User Guide</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex gap-3">
            {filteredSections.map((section) => (
              <View key={section.id} className="bg-white shadow-sm rounded-2xl shadow-gray-400">
                <TouchableOpacity activeOpacity={0.8} onPress={() => toggleSection(section.id)} className="flex-row items-center justify-between p-5">
                  <View className="flex-row items-center flex-1">
                    <View style={{ backgroundColor: section.bgColor }} className="items-center justify-center w-12 h-12 mr-4 rounded-xl">
                      <FontAwesome6 name={section.icon} size={20} color={section.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900">{section.title}</Text>
                      <Text className="text-sm text-gray-600">{section.items.length} topics</Text>
                    </View>
                  </View>
                  <Feather name={expandedSection === section.id ? "chevron-up" : "chevron-down"} size={20} color="#6b7280" />
                </TouchableOpacity>

                {expandedSection === section.id && (
                  <View className="px-5 pb-5">
                    {section.items.map((item, index) => (
                      <View key={index} className="mb-4">
                        <Text className="mb-2 text-base font-semibold text-gray-800">{item.question}</Text>
                        <Text className="mb-2 text-sm leading-relaxed text-gray-600">{item.answer}</Text>
                        {item.component && item.component}
                        {index < section.items.length - 1 && <View className="mt-4 border-b border-gray-100" />}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {searchQuery && filteredSections.length === 0 && (
            <View className="items-center py-12">
              <View className="items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                <Feather name="search" size={32} color="#6b7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">No results found</Text>
              <Text className="text-gray-600">Try searching with different keywords</Text>
            </View>
          )}

          <View className="p-6 mt-8 border-2 border-blue-200 bg-blue-50 rounded-2xl">
            <View className="items-center">
              <View className="items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                <Ionicons name="headset" size={32} color="#3b82f6" />
              </View>
              <Text className="text-xl font-bold text-blue-900">Still Need Help?</Text>
              <Text className="mt-2 text-center text-blue-700">Our support team is here to help you with your driving assignments and trip management.</Text>
              <View className="flex-row mt-4 space-x-3">
                <TouchableOpacity onPress={contactSupport} className="flex-row items-center px-4 py-3 bg-blue-600 rounded-full" activeOpacity={0.8}>
                  <Ionicons name="mail" size={16} color="white" />
                  <Text className="mx-2 font-bold text-white">Email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={makePhoneCall} className="flex-row items-center px-4 py-3 ml-2 bg-green-600 rounded-full" activeOpacity={0.8}>
                  <Ionicons name="call" size={16} color="white" />
                  <Text className="mx-2 font-bold text-white">Call</Text>
                </TouchableOpacity>
              </View>
              <Text className="mt-3 text-sm text-blue-600">support@buildorite.com</Text>
            </View>
          </View>

          <View className="items-center mt-8 mb-6">
            <Text className="text-sm text-gray-500">Buildorite Driver App</Text>
            <Text className="text-xs text-gray-400">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default DriverHelpScreen;
