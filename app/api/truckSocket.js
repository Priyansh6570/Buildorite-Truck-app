import { io } from "socket.io-client";

const SOCKET_URL = 'https://buildorite-backend.onrender.com/api/v1';
// const SOCKET_URL = "https://r7dh1jlv-3000.inc1.devtunnels.ms";

class SocketService {
  socket;
  eventListeners = new Map();

  connect() {
    console.log(`🔌 [Mine Socket] Connect called - current state: ${this.socket?.connected ? 'connected' : 'disconnected'}`);
    
    if (this.socket?.connected) {
      console.log(`🔌 [Mine Socket] Already connected with ID: ${this.socket.id}`);
      return;
    }

    if (this.socket) {
      console.log(`🔌 [Mine Socket] Disconnecting existing socket`);
      this.socket.disconnect();
    }

    console.log(`🔌 [Mine Socket] Creating new socket connection to ${SOCKET_URL}`);
    this.socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      forceNew: true,
    });

    this.socket.on("connect", () => {
      console.log(`🟢 [Mine Socket] Connected with ID: ${this.socket.id}`);
      this.reregisterListeners();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`🔴 [Mine Socket] Disconnected. Reason: ${reason}`);
    });

    this.socket.on("connect_error", (err) => {
      console.error(`❌ [Mine Socket] Connection Error: ${err.message}`);
    });

    this.socket.on("reconnect", () => {
      console.log(`🔄 [Mine Socket] Reconnected`);
      this.reregisterListeners();
    });
  }

  reregisterListeners() {
    console.log(`🔄 [Mine Socket] Re-registering ${this.eventListeners.size} event listeners`);
    for (const [event, callback] of this.eventListeners) {
      console.log(`📝 [Mine Socket] Re-registering listener for event: ${event}`);
      this.socket.on(event, callback);
    }
  }

  disconnect() {
    console.log(`🔌 [Mine Socket] Disconnect called`);
    if (this.socket) {
      this.socket.disconnect();
    }
    this.eventListeners.clear();
  }

  emit(event, data) {
    if (this.socket?.connected) {
      console.log(`📤 [Mine Socket] Emitting '${event}':`, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [Mine Socket] WARN: Tried to emit '${event}' but socket is not connected.`);
    }
  }

  on(event, cb) {
    console.log(`📝 [Mine Socket] Registering listener for event: ${event}`);
    this.eventListeners.set(event, cb);
    if (this.socket?.connected) {
      console.log(`📝 [Mine Socket] Socket connected, registering listener immediately`);
      this.socket.on(event, cb);
    } else {
      console.log(`📝 [Mine Socket] Socket not connected, will register when connected`);
    }
  }

  off(event, cb) {
    console.log(`🗑️ [Mine Socket] Removing listener for event: ${event}`);
    this.eventListeners.delete(event);
    this.socket?.off(event, cb);
  }
}

const truckSocketService = new SocketService();
export default truckSocketService;