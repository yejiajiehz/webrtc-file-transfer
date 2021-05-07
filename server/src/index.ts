import * as http from "http";
import { Server } from "socket.io";

const app = http.createServer().listen(8080);

const io = new Server(app, {
  cors: {
    origin: "http://localhost:8081",
  },
});

const defaultRoom = "kc-P2P-room";

io.sockets.on("connection", function (socket) {
  socket.on("disconnect", function (reason) {
    emitUsers();
    io.emit("P2P:exit", socket.id);
  });

  // 发送用户列表
  function emitUsers() {
    const clientsInRoom = io.sockets.adapter.rooms.get(defaultRoom);
    const users = new Set(clientsInRoom);

    io.emit("P2P:user-list", Array.from(users), socket.id);
  }

  socket.on("P2P:join", function () {
    socket.join(defaultRoom);
    socket.emit("P2P:join", socket.id);
    emitUsers();
  });

  function bindMessage(event: string) {
    socket.on(event, function (userid: string, ...args) {
      socket.to(userid).emit(event, socket.id, ...args);
    });
  }

  // A-B 发送接收文件问询
  bindMessage("P2P-A2B:ask-receive-file");
  // B-A 回应接收文件
  bindMessage("P2P-B2A:answer-receive-file");
  // 接收文件完毕
  bindMessage("P2P-B2A:receive-file-complate");

  bindMessage("P2P:ice-message");
});
