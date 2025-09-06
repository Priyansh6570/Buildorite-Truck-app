import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import * as Location from "expo-location";

// const SOCKET_URL = "https://r7dh1jlv-3000.inc1.devtunnels.ms";
const SOCKET_URL = "https://buildorite-backend.onrender.com";
const LOCATION_UPDATE_INTERVAL = 10 * 60 * 1000;

class SocketService {
  socket;
  eventListeners = new Map();
  locationUpdateTimer = null;
  isLocationUpdatesActive = false;

  connect() {
    if (this.socket?.connected) return;
    if (this.socket) this.socket.disconnect();
    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true,
    });
    this.socket.on("connect", () => {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        this.socket.emit("authenticate", { userId });
        this.startPeriodicLocationUpdates();
      }
      this.reregisterListeners();
    });
    this.socket.on("disconnect", () => {
      this.stopPeriodicLocationUpdates();
    });
    this.socket.on("connect_error", () => {});
    this.socket.on("reconnect", () => {
      this.reregisterListeners();
      const userId = useAuthStore.getState().user?.id;
      if (userId) this.startPeriodicLocationUpdates();
    });
  }

  async startPeriodicLocationUpdates() {
    if (this.isLocationUpdatesActive) return;
    const userId = useAuthStore.getState().user?.id;
    const userRole = useAuthStore.getState().user?.role;
    if (!userId || userRole !== "driver") return;
    this.isLocationUpdatesActive = true;
    await this.sendCurrentLocation();
    this.locationUpdateTimer = setInterval(async () => {
      await this.sendCurrentLocation();
    }, LOCATION_UPDATE_INTERVAL);
  }

  stopPeriodicLocationUpdates() {
    if (this.locationUpdateTimer) {
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
    }
    this.isLocationUpdatesActive = false;
  }

  async sendCurrentLocation() {
    try {
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus !== "granted") return;
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) return;
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000,
        timeout: 15000,
      });
      const userId = useAuthStore.getState().user?.id;
      if (!userId) return;
      const locationData = {
        driverId: userId,
        coordinates: [location.coords.longitude, location.coords.latitude],
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        source: "periodic_update",
      };
      if (this.socket?.connected) this.socket.emit("driverLocationUpdate", locationData);
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      if (this.socket?.connected) {
        this.socket.emit("driverLocationError", {
          driverId: useAuthStore.getState().user?.id,
          error: error.message,
          timestamp: errorTimestamp,
        });
      }
    }
  }

  async sendLocationForTracking(tripId) {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 5000,
        timeout: 10000,
      });
      const userId = useAuthStore.getState().user?.id;
      const locationData = {
        tripId,
        driverId: userId,
        coordinates: [location.coords.longitude, location.coords.latitude],
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        source: "tracking_request",
      };
      if (this.socket?.connected) {
        this.socket.emit("driverTrackingLocationUpdate", locationData);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  reregisterListeners() {
    for (const [event, callback] of this.eventListeners) {
      this.socket.on(event, callback);
    }
  }

  disconnect() {
    this.stopPeriodicLocationUpdates();
    if (this.socket) this.socket.disconnect();
    this.eventListeners.clear();
  }

  emit(event, data) {
    if (this.socket?.connected) this.socket.emit(event, data);
  }

  on(event, cb) {
    this.eventListeners.set(event, cb);
    if (this.socket?.connected) this.socket.on(event, cb);
  }

  off(event, cb) {
    this.eventListeners.delete(event);
    this.socket?.off(event, cb);
  }

  handleBackgroundReconnection() {
    if (!this.socket?.connected) {
      this.connect();
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Background reconnection timeout"));
        }, 15000);
        const onConnect = () => {
          clearTimeout(timeout);
          this.socket.off("connect", onConnect);
          this.socket.off("connect_error", onError);
          resolve(true);
        };
        const onError = (error) => {
          clearTimeout(timeout);
          this.socket.off("connect", onConnect);
          this.socket.off("connect_error", onError);
          reject(error);
        };
        if (this.socket?.connected) onConnect();
        else {
          this.socket.on("connect", onConnect);
          this.socket.on("connect_error", onError);
        }
      });
    }
    return Promise.resolve(true);
  }
}

const socketService = new SocketService();
export default socketService;
