import * as http from "http";
import { Server } from "socket.io";

const app = http.createServer().listen(8080);

const io = new Server(app, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
  allowEIO3: true,
});

const defaultRoom = "P2P-room";

io.sockets.on("connection", function (socket) {
  // 发送用户列表
  function emitUsers() {
    const clientsInRoom = io.sockets.adapter.rooms.get(defaultRoom);
    const users = new Set(clientsInRoom);

    io.emit("P2P:user-list", Array.from(users), socket.id);
  }

  // 加入默认房间，更新用户列表
  socket.on("P2P:join", function () {
    socket.join(defaultRoom);
    socket.emit("P2P:join", socket.id);
    emitUsers();
  });

  // 退出，更新用户列表
  socket.on("disconnect", function (_reason) {
    emitUsers();
    io.emit("P2P:exit", socket.id);
  });

  // 获取用户列表
  socket.on("P2P:user-list", function () {
    emitUsers();
  });

  // 点对点转发
  function bindMessage(event: string) {
    socket.on(event, function (userid: string, ...args) {
      socket.to(userid).emit(event, socket.id, ...args);
    });
  }

  bindMessage("message");

  // // A-> B 发送接收文件问询
  // bindMessage("P2P-A2B:ask-receive-file");

  // // B -> A 回应接收文件
  // bindMessage("P2P-B2A:answer-receive-file");

  // // B -> A 断点续传
  // bindMessage("P2P:file-check");

  // // B -> 接收文件完毕
  // bindMessage("P2P-B2A:receive-file-completed");

  // // A <-> B 取消传输
  // bindMessage("P2P:cancel-transfer");

  // // A <-> B webRTC ice 协商
  // bindMessage("P2P:ice-message");
});
