import io from "socket.io-client";

export function createSocket(room: string) {
  // 连接本地服务器
  const socket = io("http://localhost:8080");

  // 获取 ip 地址
  // TODO: 打洞？
  socket.on("ipaddr", function (ipaddr) {
    console.log("Server IP address is: " + ipaddr);
    // updateRoomURL(ipaddr);
  });

  return {
    socket,
    sendMessage(message: any) {
      socket.emit("message", message, room);
    },
  };
}
