import React, { useMemo, useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications, useMarkAllAsRead } from "../../hooks/useNotification";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { FontAwesome6, Feather, FontAwesome5, MaterialCommunityIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";

dayjs.extend(relativeTime);

const getNotificationMeta = (type) => {
  switch (type) {
    case "mine_request_created":
      return {
        icon: <MaterialIcons name="add-business" size={22} color="#0f766e" />,
        bgColor: "#f0fdfa",
        borderColor: "#99f6e4",
      };
    case "request_countered":
      return {
        icon: <MaterialCommunityIcons name="swap-horizontal" size={22} color="#d97706" />,
        bgColor: "#fffbeb",
        borderColor: "#fed7aa",
      };
    case "request_accepted":
      return {
        icon: <Ionicons name="checkmark-circle" size={22} color="#15803d" />,
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
      };
    case "request_rejected":
      return {
        icon: <Ionicons name="close-circle" size={22} color="#dc2626" />,
        bgColor: "#fef2f2",
        borderColor: "#fecaca",
      };
    case "request_canceled":
      return {
        icon: <MaterialIcons name="cancel" size={22} color="#6b7280" />,
        bgColor: "#f9fafb",
        borderColor: "#d1d5db",
      };
    case "driver_reassigned":
      return {
        icon: <MaterialCommunityIcons name="account-switch" size={22} color="#be185d" />,
        bgColor: "#fdf2f8",
        borderColor: "#f9a8d4",
      };
    case "driver_assigned":
      return {
        icon: <FontAwesome5 name="user-check" size={20} color="#ea580c" />,
        bgColor: "#fff7ed",
        borderColor: "#fed7aa",
      };
    case "mine_trip_milestone":
    case "truck_trip_milestone":
      return {
        icon: <FontAwesome5 name="truck-loading" size={20} color="#2563eb" />,
        bgColor: "#eff6ff",
        borderColor: "#bfdbfe",
      };
    case "mine_milestone_verified":
    case "truck_milestone_verified":
    case "driver_milestone_verified":
      return {
        icon: <MaterialCommunityIcons name="map-marker-check" size={22} color="#7c3aed" />,
        bgColor: "#f5f3ff",
        borderColor: "#c4b5fd",
      };
    case "mine_trip_issue":
    case "truck_trip_issue":
      return {
        icon: <MaterialIcons name="report-problem" size={22} color="#dc2626" />,
        bgColor: "#fef2f2",
        borderColor: "#fca5a5",
      };
    case "driver_unassigned":
      return {
        icon: <MaterialCommunityIcons name="account-minus" size={22} color="#0891b2" />,
        bgColor: "#ecfeff",
        borderColor: "#a5f3fc",
      };
    case "driver_trip_assigned":
      return {
        icon: <MaterialIcons name="assignment-ind" size={22} color="#059669" />,
        bgColor: "#ecfdf5",
        borderColor: "#a7f3d0",
      };
    default:
      return {
        icon: <Ionicons name="notifications" size={22} color="#6b7280" />,
        bgColor: "#f9fafb",
        borderColor: "#d1d5db",
      };
  }
};

const handleNotificationNavigation = (navigation, notification) => {
  if (!notification?.payload) return;

  const { requestId, tripId } = notification.payload;

  switch (notification.type) {
    case "request_countered":
    case "request_accepted":
    case "request_rejected":
    case "request_canceled":
      navigation.navigate("RequestDetailScreen", { requestId, userType: "buyer" });
      break;

    case "mine_request_created":
      navigation.navigate("RequestDetailScreen", { requestId, userType: "buyer" });
      break;
    case "driver_reassigned":
    case "driver_assigned":
    case "mine_trip_milestone":
    case "mine_milestone_verified":
    case "mine_trip_issue":
      navigation.navigate("MineTripDetail", { tripId });
      break;

    case "driver_reassigned":
    case "driver_assigned":
    case "truck_trip_milestone":
    case "truck_milestone_verified":
    case "truck_trip_issue":
      navigation.navigate("TruckOwnerTripDetail", { tripId });
      break;

    case "driver_unassigned":
    case "driver_trip_assigned":
    case "driver_milestone_verified":
      navigation.navigate("TripDetail", { tripId });
      break;

    default:
      console.log("No navigation handler for type:", notification.type);
  }
};

const classifyNotifications = (list) => {
  const now = dayjs();
  const sections = {
    New: [],
    Recent: [],
    "Last 7 Days": [],
    "Last 30 Days": [],
    Older: [],
  };

  list.forEach((n) => {
    const created = dayjs(n.createdAt);

    if (!n.is_read) {
      sections.New.push(n);
    } else if (created.isSame(now, "day")) {
      sections.Recent.push(n);
    } else if (now.diff(created, "day") <= 7) {
      sections["Last 7 Days"].push(n);
    } else if (now.diff(created, "day") <= 30) {
      sections["Last 30 Days"].push(n);
    } else {
      sections.Older.push(n);
    }
  });

  return Object.entries(sections)
    .filter(([_, items]) => items.length > 0)
    .map(([title, data]) => ({ title, data }));
};

const NotificationItem = ({ notification }) => {
  const navigation = useNavigation();
  const { icon, bgColor, borderColor } = getNotificationMeta(notification.type);
  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleNotificationNavigation(navigation, notification)}
      style={{
        backgroundColor: isUnread ? "#f0f9ff" : "#ffffff",
        borderLeftWidth: isUnread ? 4 : 0,
        borderLeftColor: "#0ea5e9",
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        {isUnread && (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#0ea5e9",
              marginRight: 12,
              marginTop: 6,
            }}
          />
        )}

        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: bgColor,
            borderWidth: 1,
            borderColor: borderColor,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
          }}
        >
          {icon}
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1f2937",
              lineHeight: 22,
              marginBottom: 4,
            }}
          >
            {notification.title}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: "#6b7280",
              lineHeight: 20,
              marginBottom: 8,
            }}
          >
            {notification.message}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="clock" size={12} color="#9ca3af" />
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginLeft: 4,
                fontWeight: "500",
              }}
            >
              {dayjs(notification.createdAt).fromNow()}
            </Text>
          </View>
        </View>

        <View style={{ justifyContent: "center", marginLeft: 8 }}>
          <Feather name="chevron-right" size={20} color="#d1d5db" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SectionHeader = ({ title, count }) => (
  <View
    style={{
      backgroundColor: "#ffffff",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    }}
  >
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Text>
  </View>
);

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data, isLoading, refetch } = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllAsRead();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      return () => {
        markAllAsRead();
      };
    }, [refetch, markAllAsRead])
  );

  const grouped = useMemo(() => {
    if (!data?.list) return [];
    return classifyNotifications(data.list);
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: "#6b7280",
            fontWeight: "500",
          }}
        >
          Loading notifications...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="arrow-left" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: "center", marginHorizontal: 16 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Notifications
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea5e9"]} tintColor="#0ea5e9" />}
      >
        {grouped.length > 0 ? (
          <View>
            {grouped.map((section) => (
              <View key={section.title}>
                <SectionHeader title={section.title} count={section.data.length} />
                {section.data.map((n, index) => (
                  <NotificationItem key={n._id} notification={n} />
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 80,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <Ionicons name="notifications-outline" size={40} color="#9ca3af" />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#374151",
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              No notifications yet
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              When you receive notifications, they'll appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;
