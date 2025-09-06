import { io } from "socket.io-client";

const SOCKET_URL = "https://buildorite-backend.onrender.com";
// const SOCKET_URL = "https://r7dh1jlv-3000.inc1.devtunnels.ms";

class SocketService {
  socket;
  eventListeners = new Map();

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
      this.reregisterListeners();
    });
    this.socket.on("disconnect", () => {});
    this.socket.on("connect_error", () => {});
    this.socket.on("reconnect", () => {
      this.reregisterListeners();
    });
  }

  reregisterListeners() {
    for (const [event, callback] of this.eventListeners) {
      this.socket.on(event, callback);
    }
  }

  disconnect() {
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
}

const truckSocketService = new SocketService();
export default truckSocketService;
