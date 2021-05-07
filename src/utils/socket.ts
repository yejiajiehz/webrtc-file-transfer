import io, { Socket } from "socket.io-client";

let socket: Socket;
export function getSocket() {
  if (!socket) {
    // 连接本地服务器
    socket = io("http://localhost:8080");

    socket.emit("P2P:join");
  }

  return socket;
}

export function bindOnce(
  socket: Socket,
  event: string,
  listener: (...args: any[]) => void
) {
  // 避免重复绑定
  if (!socket.hasListeners(event)) {
    socket.on(event, listener);
  }
  return () => socket.off(event, listener);
}
