// import { io } from "socket.io-client";

// // const SOCKET_URL = 'https://buildorite-backend.onrender.com/api/v1'

// class SocketService {
//   socket;

//   eventListeners = new Map();

//   connect() {

//     if (this.socket?.connected) {
//       return;
//     }

//     if (this.socket) {
//       this.socket.disconnect();
//     }

//     this.socket = io(SOCKET_URL, {
//       transports: ["websocket"],

//       reconnection: true,

//       reconnectionAttempts: 5,

//       forceNew: true,
//     });

//     this.socket.on("connect", () => {
//       this.reregisterListeners();
//     });

//     this.socket.on("disconnect", (reason) => {
//       console.log([Truck Socket] Disconnected. Reason: ${reason}`);
//     });

//     this.socket.on("connect_error", (err) => {
//       console.error([Truck Socket] Connection Error: ${err.message}`);
//     });

//     this.socket.on("reconnect", () => {
//       this.reregisterListeners();
//     });
//   }

//   reregisterListeners() {
//     for (const [event, callback] of this.eventListeners) {
//       this.socket.on(event, callback);
//     }
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.disconnect();
//     }

//     // Clear listeners map

//     this.eventListeners.clear();
//   }

//   emit(event, data) {
//     if (this.socket?.connected) {
//       this.socket.emit(event, data);
//     } else {
//       console.warn([Truck Socket] WARN: Tried to emit '${event}' but socket is not connected.`);
//     }
//   }

//   on(event, cb) {
//     this.eventListeners.set(event, cb);
//     if (this.socket?.connected) {
//       this.socket.on(event, cb);
//     } else {
//       console.log([Truck Socket] Socket not connected, will register when connected);
//     }
//   }

//   off(event, cb) {
//     this.eventListeners.delete(event);
//     this.socket?.off(event, cb);
//   }
// }

// const socketService = new SocketService();

// export default socketService;