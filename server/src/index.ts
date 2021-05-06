import * as os from "os";
import * as http from "http";
import { Server, Socket } from "socket.io";

const app = http.createServer().listen(8080);

const io = new Server(app, {
  cors: {
    origin: "http://localhost:8081",
  },
});

const broadcastRoom = (socket: Socket, room: string) => {
  const clientsInRoom = io.sockets.adapter.rooms.get(room);
  const inRoom = room && clientsInRoom?.has(socket.id);

  return (ev: string, ...args: any[]) => {
    if (inRoom) {
      if (args[1]?.type) {
        console.log(args[0], "Client " + socket.id + " said: ", args[1]?.type);
      }
      socket.to(room).emit(ev, ...args);
    }
  };
};

const defaultRoom = "kc-P2P-room";

io.sockets.on("connection", function (socket) {
  socket.on("ipaddr", function () {
    const ifaces = os.networkInterfaces();
    for (const dev in ifaces) {
      ifaces[dev]?.forEach(function (details) {
        if (details.family === "IPv4" && details.address !== "127.0.0.1") {
          socket.emit("ipaddr", details.address);
        }
      });
    }
  });

  socket.on("disconnect", function (reason) {
    emitUsers();
    socket.emit("P2P:exit", socket.id);
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

  // 发送接收文件问询
  socket.on("P2P-B:receive-file", function (userid, filename) {
    const room = socket.id + "_" + userid;
    socket.join(room);

    socket.to(userid).emit("P2P-B:receive-file", room, socket.id, filename);
  });

  // 接收文件，房间ready
  socket.on("P2P-A:receive-file", function (room) {
    socket.join(room);

    const clientsInRoom = io.sockets.adapter.rooms.get(room);

    if (clientsInRoom?.size === 2) {
      socket.to(room).emit("P2P-A:ready", room);
    }
  });

  // 拒绝接收文件
  socket.on("P2P-A:refuse-file", function (userid) {
    socket.to(userid).emit("P2P-A:refuse-file", userid);
  });

  socket.on("P2P:ice-message", function (room, message) {
    broadcastRoom(socket, room)("P2P:ice-message", room, message);
  });
});
