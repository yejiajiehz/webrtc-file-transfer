import io from "socket.io-client";

export function createSocket(
  room: string,
  onJoined: Function
  // onmessage: Function
) {
  // 连接本地服务器
  const socket = io("http://localhost:8080");

  // 用户加入房间

  // socket.on("joined", function (room, clientId) {
  //   console.log("This peer has joined room", room, "with client ID", clientId);
  //   onJoined();
  // });

  // 获取 ip 地址
  // TODO: 打洞？
  socket.on("ipaddr", function (ipaddr) {
    console.log("Server IP address is: " + ipaddr);
    // updateRoomURL(ipaddr);
  });

  socket.on("ready", (room, id) => {
    onJoined(room, id);
  });

  // socket.on("message", function (message) {
  //   console.log("Client received message:", message);
  //   onmessage(message);
  // });

  // Joining a room.
  // console.log("create or join", room);
  socket.emit("join", room);

  // 退出的时候，退出服务
  // window.addEventListener("unload", function () {
  //   // console.log(`Unloading window. Notifying peers in ${room}.`);
  //   socket.emit("bye", room);
  // });

  return {
    socket,
    sendMessage(message: any) {
      socket.emit("message", message);
    },
  };
}
