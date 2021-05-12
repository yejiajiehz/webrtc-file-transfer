import io, { Socket } from "socket.io-client";

let socket: Socket;
export function getSocket() {
  if (!socket) {
    // 连接本地服务器
    socket = io("http://localhost:8080");
    // TOOD: 用户名称
    socket.emit("P2P:join");
  }

  return socket;
}
