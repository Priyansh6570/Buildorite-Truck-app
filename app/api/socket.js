import { io } from "socket.io-client";
import { useAuthStore } from "../store/authStore";

const SOCKET_URL = "https://r7dh1jlv-3000.inc1.devtunnels.ms";

class SocketService {
  socket;
  eventListeners = new Map();

  connect() {
    console.log(`🔌 [SocketService] Connect called - current state: ${this.socket?.connected ? 'connected' : 'disconnected'}`);
    
    if (this.socket?.connected) {
      console.log(`🔌 [SocketService] Already connected, skipping`);
      return;
    }
    
    if (this.socket) {
      console.log(`🔌 [SocketService] Disconnecting existing socket`);
      this.socket.disconnect();
    }

    console.log(`🔌 [SocketService] Creating new socket connection to ${SOCKET_URL}`);
    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true,
    });

    this.socket.on("connect", () => {
      console.log(`🟢 [SocketService] Connected with ID: ${this.socket.id}`);
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        console.log(`🔐 [SocketService] Authenticating user ${userId} on connection.`);
        this.socket.emit("authenticate", { userId });
      }
      
      // Re-register all event listeners after connection
      this.reregisterListeners();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`🔴 [SocketService] Disconnected. Reason: ${reason}`);
    });

    this.socket.on("connect_error", (err) => {
      console.error(`❌ [SocketService] Connection Error: ${err.message}`);
    });

    this.socket.on("reconnect", () => {
      console.log(`🔄 [SocketService] Reconnected`);
      this.reregisterListeners();
    });
  }

  reregisterListeners() {
    console.log(`🔄 [SocketService] Re-registering ${this.eventListeners.size} event listeners`);
    for (const [event, callback] of this.eventListeners) {
      console.log(`📝 [SocketService] Re-registering listener for event: ${event}`);
      this.socket.on(event, callback);
    }
  }

  disconnect() {
    console.log(`🔌 [SocketService] Disconnect called`);
    if (this.socket) {
      this.socket.disconnect();
    }
    // Clear listeners map
    this.eventListeners.clear();
  }

  emit(event, data) {
    if (this.socket?.connected) {
      console.log(`📤 [SocketService] Emitting '${event}':`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [SocketService] WARN: Tried to emit '${event}' but socket is not connected.`);
    }
  }

  on(event, cb) {
    console.log(`📝 [SocketService] Registering listener for event: ${event}`);
    
    // Store the listener in our map
    this.eventListeners.set(event, cb);
    
    // If socket is connected, register immediately
    if (this.socket?.connected) {
      console.log(`📝 [SocketService] Socket connected, registering listener immediately`);
      this.socket.on(event, cb);
    } else {
      console.log(`📝 [SocketService] Socket not connected, will register when connected`);
    }
  }

  off(event, cb) {
    console.log(`🗑️ [SocketService] Removing listener for event: ${event}`);
    
    // Remove from our map
    this.eventListeners.delete(event);
    
    // Remove from socket if it exists
    this.socket?.off(event, cb);
  }

  handleBackgroundReconnection() {
  if (!this.socket?.connected) {
    console.log("[SocketService] Attempting background reconnection...");
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