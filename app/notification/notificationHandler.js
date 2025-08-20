import { navigationRef } from "../navigation/navigationRef";

export const handleNotificationNavigation = (data) => {
  if (!navigationRef.isReady() || !data?.payload) return;

  const { requestId, tripId } = data.payload;

  switch (data.type) {
    // 🟢 Request → RequestDetailScreen
    case "request_countered":
    case "request_accepted":
    case "request_rejected":
    case "request_canceled":
      navigationRef.navigate("RequestDetailScreen", {
        requestId,
        userType: "seller",
      });
      break;

    // 🟢 Truck Owner → TruckOwnerTripDetail
    case "driver_reassigned":
    case "driver_assigned":
    case "truck_trip_milestone":
    case "truck_milestone_verified":
    case "truck_trip_issue":
      navigationRef.navigate("TruckOwnerTripDetail", {
        tripId,
      });
      break;

    // 🟢 Driver → TripDetail
    case "driver_unassigned":
    case "driver_trip_assigned":
    case "driver_milestone_verified":
      navigationRef.navigate("TripDetail", {
        tripId,
      });
      break;

    default:
      console.log("No navigation handler for type:", data.type);
  }
};