import io, { Socket } from "socket.io-client";
import { log } from "./log";

let socket: Socket;
export function getSocket() {
  if (!socket) {
    // 连接本地服务器
    socket = io("http://localhost:8080");

    socket.emit("P2P:join");
  }

  return socket;
}
