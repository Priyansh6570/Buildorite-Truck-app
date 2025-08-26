import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import { LinearGradient } from 'expo-linear-gradient';

// Navigation Path Component
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
          {index < steps.length - 1 && (
            <Ionicons name="chevron-forward" size={16} color="#60a5fa" className="mx-2" />
          )}
        </View>
      ))}
    </View>
  </View>
);

// Step-by-Step Component
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

// Permission Item Component
const PermissionItem = ({ icon, title, description, color }) => (
  <View className="flex-row items-start p-3 mb-3 bg-white border border-gray-200 rounded-xl">
    <View 
      className="items-center justify-center w-10 h-10 mr-3 rounded-full"
      style={{ backgroundColor: `${color}20` }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View className="flex-1">
      <Text className="font-semibold text-gray-900">{title}</Text>
      <Text className="text-sm text-gray-600">{description}</Text>
    </View>
  </View>
);

// Request Process Component
const RequestProcessFlow = () => {
  const stages = [
    { stage: 'Request Sent', description: 'Your material request submitted to mine owner', icon: 'paper-plane', status: 'pending' },
    { stage: 'Pending Review', description: 'Mine owner reviewing your request', icon: 'time', status: 'pending' },
    { stage: 'Response Received', description: 'Mine owner responds (Accept/Reject/Counter)', icon: 'chatbubble', status: 'response' },
    { stage: 'Counter Negotiation', description: 'Optional: Back-and-forth negotiation', icon: 'swap-horizontal', status: 'counter', optional: true },
    { stage: 'Request Accepted', description: 'Final agreement reached', icon: 'checkmark-circle', status: 'accepted' },
    { stage: 'Driver Assignment', description: 'For Pickup: Assign your driver', icon: 'person-add', status: 'driver', conditional: 'Pickup only' },
    { stage: 'Trip Begins', description: 'Trip created and journey starts', icon: 'play-circle', status: 'trip' },
  ];

  return (
    <View className="p-4 my-3 border border-orange-200 bg-orange-50 rounded-xl">
      <View className="flex-row items-center mb-4">
        <Ionicons name="git-network" size={16} color="#ea580c" />
        <Text className="ml-2 text-sm font-semibold text-orange-900">Request Journey:</Text>
      </View>
      
      {stages.map((item, index) => (
        <View key={index} className="flex-row items-start mb-3">
          <View className="items-center mr-3">
            <View 
              className={`items-center justify-center w-10 h-10 rounded-full ${
                item.status === 'pending' ? 'bg-yellow-200' :
                item.status === 'response' ? 'bg-blue-200' :
                item.status === 'counter' ? 'bg-purple-200' :
                item.status === 'accepted' ? 'bg-green-200' :
                item.status === 'driver' ? 'bg-orange-200' :
                'bg-gray-200'
              }`}
            >
              <Ionicons 
                name={item.icon} 
                size={18} 
                color={
                  item.status === 'pending' ? '#d97706' :
                  item.status === 'response' ? '#3b82f6' :
                  item.status === 'counter' ? '#a855f7' :
                  item.status === 'accepted' ? '#16a34a' :
                  item.status === 'driver' ? '#ea580c' :
                  '#6b7280'
                } 
              />
            </View>
            {index < stages.length - 1 && (
              <View className="w-0.5 h-6 mt-1 bg-orange-300" />
            )}
          </View>
          <View className="flex-1 pb-2">
            <View className="flex-row flex-wrap items-center">
              <Text className="font-semibold text-orange-900">{item.stage}</Text>
              {item.optional && (
                <View className="px-2 py-1 ml-2 bg-purple-100 rounded-full">
                  <Text className="text-xs font-bold text-purple-700">OPTIONAL</Text>
                </View>
              )}
              {item.conditional && (
                <View className="px-2 py-1 ml-2 bg-blue-100 rounded-full">
                  <Text className="text-xs font-bold text-blue-700">{item.conditional}</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-orange-700">{item.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Trip Stage Component for Truck Owner
const TruckOwnerTripFlow = () => {
  const stages = [
    { stage: 'Trip Assigned', description: 'Driver assigned to the request', icon: 'person-add', yourRole: false },
    { stage: 'Trip Started', description: 'Driver begins journey to pickup location', icon: 'play', yourRole: false },
    { stage: 'Arrived at Pickup', description: 'Driver reaches the mine site', icon: 'location', yourRole: false },
    { stage: 'Loading Complete', description: 'Materials loaded onto your vehicle', icon: 'cube', yourRole: false },
    { stage: 'Pickup Verified', description: 'Mine owner verifies quantity & quality', icon: 'checkmark-circle', yourRole: false },
    { stage: 'En Route to Delivery', description: 'Driver traveling to destination', icon: 'car', yourRole: false },
    { stage: 'Arrived at Delivery', description: 'Driver reaches delivery point', icon: 'location-outline', yourRole: false },
    { stage: 'Delivery Complete', description: 'Materials unloaded at destination', icon: 'download', yourRole: false },
    { stage: 'Delivery Verified', description: 'YOU verify successful delivery', icon: 'checkmark-done', yourRole: true },
  ];

  return (
    <View className="p-4 my-3 border border-blue-200 bg-blue-50 rounded-xl">
      <View className="flex-row items-center mb-4">
        <Ionicons name="flag" size={16} color="#3b82f6" />
        <Text className="ml-2 text-sm font-semibold text-blue-900">Trip Journey (Your Perspective):</Text>
      </View>
      
      {stages.map((item, index) => (
        <View key={index} className="flex-row items-start mb-3">
          <View className="items-center mr-3">
            <View 
              className={`items-center justify-center w-10 h-10 rounded-full ${
                item.yourRole ? 'bg-orange-200' : 'bg-blue-200'
              }`}
            >
              <Ionicons 
                name={item.icon} 
                size={18} 
                color={item.yourRole ? '#f97316' : '#3b82f6'} 
              />
            </View>
            {index < stages.length - 1 && (
              <View className="w-0.5 h-6 mt-1 bg-blue-300" />
            )}
          </View>
          <View className="flex-1 pb-2">
            <View className="flex-row items-center">
              <Text className="font-semibold text-blue-900">{item.stage}</Text>
              {item.yourRole && (
                <View className="px-2 py-1 ml-2 bg-orange-100 rounded-full">
                  <Text className="text-xs font-bold text-orange-700">YOUR ACTION</Text>
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

const TruckOwnerHelpScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  // Help sections data for Truck Owner
  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      items: [
        {
          question: 'How do I create a truck owner account?',
          answer: 'Registration is simple, enter your phone number, email, and name during registration. You\'ll receive a verification code to confirm your phone number.'
        },
        {
          question: 'What permissions does the truck app need?',
          answer: 'The truck app requires the essential permissions for optimal functionality:',
          component: (
            <View className="my-3">
              <PermissionItem
                icon="location"
                title="Location Permission"
                description="Required for calculating distances to mines, tracking deliveries, and showing nearby suppliers"
                color="#ef4444"
              />
              <PermissionItem
                icon="notifications"
                title="Notification Permission"
                description="Essential for real-time alerts about request responses, trip updates, and important communications"
                color="#3b82f6"
              />
              <PermissionItem
                icon="camera"
                title="Photos Access"
                description="Needed for capturing delivery photos and sharing mine promotional content"
                color="#16a34a"
              />
            </View>
          )
        },
        {
          question: 'How do I explore the Buildorite marketplace?',
          answer: 'As a truck owner, you have full access to browse all mines and materials in the Buildorite marketplace. Use the Home screen to discover nearby mines or the Search screen to find specific materials and suppliers.'
        }
      ]
    },
    {
      id: 'marketplace',
      title: 'Marketplace & Discovery',
      icon: 'magnifying-glass',
      color: '#059669',
      bgColor: '#ecfdf5',
      items: [
        {
          question: 'How can I find mines and materials?',
          answer: 'Browse the comprehensive Buildorite marketplace using multiple discovery options:',
          component: (
            <StepByStep 
              title="Discovery Methods"
              steps={[
                'Use Home screen to browse nearby mines and featured materials',
                'Access Search screen to find specific materials by type or location',
                'Apply filters by distance, material type, price range, and availability',
                'View detailed mine profiles with materials, pricing, and operational hours',
                'Check material specifications, photos, and pricing tiers'
              ]}
            />
          )
        },
        {
          question: 'What information can I see about mines?',
          answer: 'Each mine profile provides comprehensive details including location, operational hours, available materials with pricing, high-quality photos, and contact information to help you make informed decisions.'
        },
        {
          question: 'How do I share mine information?',
          answer: 'You can promote mines using the sharing features:',
          component: (
            <View className="p-4 my-3 border border-purple-200 bg-purple-50 rounded-xl">
              <View className="flex-row items-center mb-3">
                <Ionicons name="share-social" size={16} color="#a855f7" />
                <Text className="ml-2 text-sm font-semibold text-purple-900">Sharing Options:</Text>
              </View>
              <View className="space-y-2">
                <Text className="mb-2 text-sm text-purple-800">• <Text className="font-semibold">Deeplink Share:</Text> Direct app links for public</Text>
                <Text className="mb-2 text-sm text-purple-800">• <Text className="font-semibold">Social Cards:</Text> Custom themed cards for social media</Text>
                <Text className="text-sm text-purple-800">• <Text className="font-semibold">Copy Link:</Text> Shareable links for websites and messaging</Text>
              </View>
            </View>
          )
        }
      ]
    },
    {
      id: 'requests',
      title: 'Material Requests',
      icon: 'clipboard-list',
      color: '#dc2626',
      bgColor: '#fee2e2',
      items: [
        {
          question: 'How do I request materials from a mine?',
          answer: 'After viewing material details, use the request option to specify your requirements:',
          component: (
            <React.Fragment>
              <NavigationPath steps={['Browse Mine', 'Material Details', 'Request Material']} />
              <StepByStep 
                title="Request Details Required"
                steps={[
                  'Select material type and specify quantity needed',
                  'Choose delivery type: Pickup (your driver) or Delivery (mine arranges)',
                  'Set preferred pickup/delivery date and time',
                  'Provide delivery address if choosing Delivery option',
                  'Add any special requirements or notes',
                  'Submit request and wait for mine owner response'
                ]}
              />
            </React.Fragment>
          )
        },
        {
          question: 'What happens after I send a request?',
          answer: 'Your request goes through a structured process with multiple possible outcomes:',
          component: <RequestProcessFlow />
        },
        {
          question: 'How do I handle counter-offers?',
          answer: 'When a mine owner sends a counter-offer, you have three options: Accept the new terms, Make a re-counter with your preferred terms, or Cancel the request if terms don\'t work for you.'
        },
        {
          question: 'What\'s the difference between Pickup and Delivery requests?',
          answer: 'Pickup: You assign your own driver who will collect materials from the mine. Delivery: The mine owner arranges transportation to your specified location.'
        }
      ]
    },
    {
      id: 'drivers',
      title: 'Driver Management',
      icon: 'user-group',
      color: '#7c3aed',
      bgColor: '#f3e8ff',
      items: [
        {
          question: 'How do I add drivers to my network?',
          answer: 'Simply provide the driver\'s phone number and name. They\'ll receive an invitation to download the app and join your network.'
        },
        {
          question: 'When do I need to assign drivers?',
          answer: 'Driver assignment is required for Pickup-type requests after the mine owner accepts your request. For Delivery requests, the mine owner handles driver assignment.'
        },
        {
          question: 'Can I change drivers during a trip?',
          answer: 'Yes, you can reassign drivers which will cancel the current trip and create a new one with the new driver. However, this should be done carefully to avoid delays.'
        }
      ]
    },
    {
      id: 'trips',
      title: 'Trip Management & Tracking',
      icon: 'map-location-dot',
      color: '#059669',
      bgColor: '#ecfdf5',
      items: [
        {
          question: 'How do trip stages work for truck owners?',
          answer: 'Here\'s your complete trip journey from assignment to completion:',
          component: <TruckOwnerTripFlow />
        },
        {
          question: 'What is "Delivery Verified" and why is it important?',
          answer: 'This is YOUR key responsibility as the truck owner. Once materials are delivered to the destination, you must verify the successful delivery to mark the trip as completed. This confirms the service was provided satisfactorily.'
        },
        {
          question: 'How does real-time tracking work?',
          answer: 'Once your trip starts, you can track your driver\'s location on the in-app map, monitor distance remaining, get estimated arrival times, and receive updates at each trip stage.'
        },
        {
          question: 'What tracking features are available?',
          answer: 'Monitor pickup progress, track en-route journey, get delivery notifications, view trip history, and access detailed trip analytics for business insights.'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Business Insights',
      icon: 'chart-line',
      color: '#dc2626',
      bgColor: '#fee2e2',
      items: [
        {
          question: 'How do I access my business analytics?',
          answer: 'Access your comprehensive business insights:',
          component: (
            <View className="p-4 my-3 border border-purple-200 bg-purple-50 rounded-xl">
              <View className="flex-row items-center">
                <View className="items-center justify-center w-8 h-8 mr-3 bg-purple-200 rounded-lg">
                  <FontAwesome6 name="chart-line" size={16} color="#a855f7" />
                </View>
                <Text className="text-sm font-medium text-purple-900">
                  <Text className="font-bold">"View Report" button</Text> on your Home screen
                </Text>
              </View>
            </View>
          )
        },
        {
          question: 'What insights can I track?',
          answer: 'Monitor your transportation business with detailed analytics: total requests sent, successful deliveries, trip efficiency, top suppliers, cost analysis, driver performance, and logistics optimization metrics.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: 'user-gear',
      color: '#4b5563',
      bgColor: '#f3f4f6',
      items: [
        {
          question: 'How do I update my account information?',
          answer: 'Update your profile details using following process:',
          component: (
            <React.Fragment>
              <NavigationPath steps={['Profile', 'Settings', 'Account']} />
              <Text className="mt-2 text-sm text-gray-600">
                Here you can update your phone number, name, and email address to keep your account information current.
              </Text>
            </React.Fragment>
          )
        },
        {
          question: 'How do I manage notifications?',
          answer: 'Enable notifications to receive real-time alerts about request responses, trip updates, driver status changes, and important business communications from mine owners.'
        }
      ]
    }
  ];

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.items.some(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const contactSupport = () => {
    const email = 'support@buildorite.com';
    const subject = 'Truck App Support Request';
    const deviceInfo = `${Device.brand || 'Unknown'} ${Device.modelName || 'Unknown'}`;
    const osVersion = `${Platform.OS} ${Platform.Version}`;
    const body = `Hello Support Team,

I need help with:

[Please describe your issue here]

App Version: 1.0.0 (Truck Owner)
Device: ${deviceInfo}
OS: ${osVersion}

Thank you!`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        Alert.alert(
          'Email Support',
          `Please contact us at: ${email}`,
          [{ text: 'OK' }]
        );
      });
  };

  const makePhoneCall = () => {
    const phoneNumber = '8871558564';
    Linking.openURL(`tel:${phoneNumber}`)
      .catch(() => {
        Alert.alert(
          'Phone Call',
          `Please call us at: ${phoneNumber}`,
          [{ text: 'OK' }]
        );
      });
  };

  const showVideoMessage = () => {
    Alert.alert(
      'Video Tutorials',
      'Video tutorials for truck owners are not available yet. We\'re working on creating helpful video content for transportation logistics!',
      [{ text: 'OK' }]
    );
  };

  const showUserGuide = () => {
    Alert.alert(
      'User Guide',
      'Comprehensive truck owner guide with detailed screenshots and step-by-step instructions coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ paddingTop: insets.top }} className="pb-4 bg-white shadow-lg">
        <View className="flex-row items-center justify-between p-6">
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => navigation.goBack()} 
            className="p-3 bg-gray-100 border border-slate-200 rounded-xl"
          >
            <Feather name="arrow-left" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-2xl font-extrabold text-center text-gray-900">Help & Support</Text>
          <TouchableOpacity 
            onPress={contactSupport}
            activeOpacity={0.8} 
            className="overflow-hidden rounded-xl"
          >
            <LinearGradient colors={["#3b82f6", "#1d4ed8"]} className="p-3">
              <Ionicons name="mail" size={18} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="mx-6 mt-4">
          <View className="flex-row items-center px-4 py-3 bg-gray-100 rounded-xl">
            <Feather name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholder="Search help topics..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={20} color="#6b7280" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="mb-4 text-lg font-bold text-gray-900">Quick Actions</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity 
                onPress={makePhoneCall}
                className="flex-1 p-4 border border-green-200 bg-green-50 rounded-2xl"
              >
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-green-100 rounded-full">
                    <Ionicons name="call" size={24} color="#16a34a" />
                  </View>
                  <Text className="text-sm font-semibold text-green-900">Call Support</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={showVideoMessage}
                className="flex-1 p-4 border border-blue-200 bg-blue-50 rounded-2xl"
              >
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-blue-100 rounded-full">
                    <Feather name="video" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-sm font-semibold text-blue-900">Video Tutorials</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={showUserGuide}
                className="flex-1 p-4 border border-purple-200 bg-purple-50 rounded-2xl"
              >
                <View className="items-center">
                  <View className="items-center justify-center w-12 h-12 mb-2 bg-purple-100 rounded-full">
                    <Feather name="book-open" size={24} color="#a855f7" />
                  </View>
                  <Text className="text-sm font-semibold text-purple-900">User Guide</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Help Sections */}
          <View className="flex gap-3">
            {filteredSections.map((section) => (
              <View key={section.id} className="bg-white shadow-sm rounded-2xl shadow-gray-400">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => toggleSection(section.id)}
                  className="flex-row items-center justify-between p-5"
                >
                  <View className="flex-row items-center flex-1">
                    <View 
                      style={{ backgroundColor: section.bgColor }}
                      className="items-center justify-center w-12 h-12 mr-4 rounded-xl"
                    >
                      <FontAwesome6 name={section.icon} size={20} color={section.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900">{section.title}</Text>
                      <Text className="text-sm text-gray-600">{section.items.length} topics</Text>
                    </View>
                  </View>
                  <Feather 
                    name={expandedSection === section.id ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#6b7280" 
                  />
                </TouchableOpacity>

                {expandedSection === section.id && (
                  <View className="px-5 pb-5">
                    {section.items.map((item, index) => (
                      <View key={index} className="mb-4">
                        <Text className="mb-2 text-base font-semibold text-gray-800">
                          {item.question}
                        </Text>
                        <Text className="mb-2 text-sm leading-relaxed text-gray-600">
                          {item.answer}
                        </Text>
                        {item.component && item.component}
                        {index < section.items.length - 1 && (
                          <View className="mt-4 border-b border-gray-100" />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* No Results */}
          {searchQuery && filteredSections.length === 0 && (
            <View className="items-center py-12">
              <View className="items-center justify-center w-16 h-16 mb-4 bg-gray-100 rounded-full">
                <Feather name="search" size={32} color="#6b7280" />
              </View>
              <Text className="text-lg font-semibold text-gray-900">No results found</Text>
              <Text className="text-gray-600">Try searching with different keywords</Text>
            </View>
          )}
          {/* Support Section */}
          <View className="p-6 mt-8 border-2 border-blue-200 bg-blue-50 rounded-2xl">
            <View className="items-center">
              <View className="items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                <Ionicons name="headset" size={32} color="#3b82f6" />
              </View>
              <Text className="text-xl font-bold text-blue-900">Still Need Help?</Text>
              <Text className="mt-2 text-center text-blue-700">
                Our support team is here to help you succeed with your mining business.
              </Text>
              <View className="flex-row mt-4 space-x-3">
                <TouchableOpacity
                  onPress={contactSupport}
                  className="flex-row items-center px-4 py-3 bg-blue-600 rounded-full"
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail" size={16} color="white" />
                  <Text className="mx-2 font-bold text-white">Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={makePhoneCall}
                  className="flex-row items-center px-4 py-3 ml-2 bg-green-600 rounded-full"
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color="white" />
                  <Text className="mx-2 font-bold text-white">Call</Text>
                </TouchableOpacity>
              </View>
              <Text className="mt-3 text-sm text-blue-600">support@buildorite.com</Text>
            </View>
          </View>

          {/* App Info */}
          <View className="items-center mt-8 mb-6">
            <Text className="text-sm text-gray-500">Buildorite Mine App</Text>
            <Text className="text-xs text-gray-400">Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TruckOwnerHelpScreen;