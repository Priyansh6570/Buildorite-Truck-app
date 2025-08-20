import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import * as Location from "expo-location";

const SOCKET_URL = "https://buildorite-backend.onrender.com/api/v1";
const LOCATION_UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes

class SocketService {
  socket;
  eventListeners = new Map();
  locationUpdateTimer = null;
  isLocationUpdatesActive = false;

  connect() {
    // console.log(`🔌 [DriverSocket] Connect called - current state: ${this.socket?.connected ? 'connected' : 'disconnected'}`);
    
    if (this.socket?.connected) {
      // console.log(`🔌 [DriverSocket] Already connected, skipping`);
      return;
    }
    
    if (this.socket) {
      // console.log(`🔌 [DriverSocket] Disconnecting existing socket`);
      this.socket.disconnect();
    }

    // console.log(`🔌 [DriverSocket] Creating new socket connection to ${SOCKET_URL}`);
    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true,
    });

    this.socket.on("connect", () => {
      // console.log(`🟢 [DriverSocket] Connected with ID: ${this.socket.id}`);
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        // console.log(`🔐 [DriverSocket] Authenticating user ${userId} on connection.`);
        this.socket.emit("authenticate", { userId });
        
        // Start sending periodic location updates after authentication
        this.startPeriodicLocationUpdates();
      }
      
      // Re-register all event listeners after connection
      this.reregisterListeners();
    });

    this.socket.on("disconnect", (reason) => {
      // console.log(`🔴 [DriverSocket] Disconnected. Reason: ${reason}`);
      this.stopPeriodicLocationUpdates();
    });

    this.socket.on("connect_error", (err) => {
      // console.error(`❌ [DriverSocket] Connection Error: ${err.message}`);
    });

    this.socket.on("reconnect", () => {
      // console.log(`🔄 [DriverSocket] Reconnected`);
      this.reregisterListeners();
      
      // Restart location updates on reconnection
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        this.startPeriodicLocationUpdates();
      }
    });
  }

  async startPeriodicLocationUpdates() {
    if (this.isLocationUpdatesActive) {
      // console.log(`📍 [DriverSocket] Location updates already active`);
      return;
    }

    const userId = useAuthStore.getState().user?.id;
    const userRole = useAuthStore.getState().user?.role;

    if (!userId || userRole !== 'driver') {
      // console.log(`📍 [DriverSocket] Not starting location updates - User not driver or not authenticated`);
      return;
    }

    // console.log(`📍 [DriverSocket] Starting periodic location updates for driver: ${userId}`);
    this.isLocationUpdatesActive = true;

    // Send location immediately on connect
    await this.sendCurrentLocation();

    // Set up periodic updates every 10 minutes
    this.locationUpdateTimer = setInterval(async () => {
      await this.sendCurrentLocation();
    }, LOCATION_UPDATE_INTERVAL);
  }

  stopPeriodicLocationUpdates() {
    if (this.locationUpdateTimer) {
      // console.log(`📍 [DriverSocket] Stopping periodic location updates`);
      clearInterval(this.locationUpdateTimer);
      this.locationUpdateTimer = null;
    }
    this.isLocationUpdatesActive = false;
  }

  async sendCurrentLocation() {
    const timestamp = new Date().toISOString();
    // console.log(`📍 [DriverSocket] [${timestamp}] Attempting to get current location`);

    try {
      // Check permissions first
      const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        // console.warn(`📍 [DriverSocket] [${timestamp}] Location permission not granted`);
        return;
      }

      // Check if location services are enabled
      const providerStatus = await Location.getProviderStatusAsync();
      if (!providerStatus.locationServicesEnabled) {
        // console.warn(`📍 [DriverSocket] [${timestamp}] Location services disabled`);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 30000,
        timeout: 15000,
      });

      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        // console.warn(`📍 [DriverSocket] [${timestamp}] No user ID found`);
        return;
      }

      const locationData = {
        driverId: userId,
        coordinates: [location.coords.longitude, location.coords.latitude],
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        source: 'periodic_update'
      };

      // console.log(`📍 [DriverSocket] [${timestamp}] Sending location update:`, {
      //   lat: location.coords.latitude,
      //   lng: location.coords.longitude,
      //   accuracy: location.coords.accuracy
      // });

      if (this.socket?.connected) {
        this.socket.emit("driverLocationUpdate", locationData);
        // console.log(`✅ [DriverSocket] [${timestamp}] Location sent successfully`);
      } else {
        // console.warn(`📍 [DriverSocket] [${timestamp}] Socket not connected, location not sent`);
      }

    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      // console.error(`📍 [DriverSocket] [${errorTimestamp}] Failed to get/send location:`, error);
      
      // Emit location error to server
      if (this.socket?.connected) {
        this.socket.emit("driverLocationError", {
          driverId: useAuthStore.getState().user?.id,
          error: error.message,
          timestamp: errorTimestamp
        });
      }
    }
  }

  // Manual location update (for immediate tracking requests)
  async sendLocationForTracking(tripId) {
    const timestamp = new Date().toISOString();
    // console.log(`🎯 [DriverSocket] [${timestamp}] Sending location for tracking request - Trip: ${tripId}`);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 5000, // Fresh location within 5 seconds
        timeout: 10000,
      });

      const userId = useAuthStore.getState().user?.id;
      const locationData = {
        tripId,
        driverId: userId,
        coordinates: [location.coords.longitude, location.coords.latitude],
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
        source: 'tracking_request'
      };

      // console.log(`🎯 [DriverSocket] [${timestamp}] Sending tracking location:`, locationData);
      
      if (this.socket?.connected) {
        this.socket.emit("driverTrackingLocationUpdate", locationData);
        return true;
      }
      
      return false;
    } catch (error) {
      // console.error(`🎯 [DriverSocket] [${timestamp}] Failed to send tracking location:`, error);
      return false;
    }
  }

  reregisterListeners() {
    // console.log(`🔄 [DriverSocket] Re-registering ${this.eventListeners.size} event listeners`);
    for (const [event, callback] of this.eventListeners) {
      // console.log(`📝 [DriverSocket] Re-registering listener for event: ${event}`);
      this.socket.on(event, callback);
    }
  }

  disconnect() {
    // console.log(`🔌 [DriverSocket] Disconnect called`);
    this.stopPeriodicLocationUpdates();
    
    if (this.socket) {
      this.socket.disconnect();
    }
    // Clear listeners map
    this.eventListeners.clear();
  }

  emit(event, data) {
    if (this.socket?.connected) {
      // console.log(`📤 [DriverSocket] Emitting '${event}':`, data);
      this.socket.emit(event, data);
    } else {
      // console.warn(`⚠️ [DriverSocket] WARN: Tried to emit '${event}' but socket is not connected.`);
    }
  }

  on(event, cb) {
    // console.log(`📝 [DriverSocket] Registering listener for event: ${event}`);
    
    // Store the listener in our map
    this.eventListeners.set(event, cb);
    
    // If socket is connected, register immediately
    if (this.socket?.connected) {
      // console.log(`📝 [DriverSocket] Socket connected, registering listener immediately`);
      this.socket.on(event, cb);
    } else {
      // console.log(`📝 [DriverSocket] Socket not connected, will register when connected`);
    }
  }

  off(event, cb) {
    // console.log(`🗑️ [DriverSocket] Removing listener for event: ${event}`);
    
    // Remove from our map
    this.eventListeners.delete(event);
    
    // Remove from socket if it exists
    this.socket?.off(event, cb);
  }

  handleBackgroundReconnection() {
    if (!this.socket?.connected) {
      // console.log("[DriverSocket] Attempting background reconnection...");
      this.connect();
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Background reconnection timeout'));
        }, 15000);
        
        const onConnect = () => {
          clearTimeout(timeout);
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
          resolve(true);
        };
        
        const onError = (error) => {
          clearTimeout(timeout);
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
          reject(error);
        };
        
        if (this.socket?.connected) {
          onConnect();
        } else {
          this.socket.on('connect', onConnect);
          this.socket.on('connect_error', onError);
        }
      });
    }
    return Promise.resolve(true);
  }
}

const socketService = new SocketService();
export default socketService;