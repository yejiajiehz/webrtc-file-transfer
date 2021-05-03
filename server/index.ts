"use strict";

import * as os from "os";
import * as nodeStatic from "node-static";
import * as http from "http";
import { Server, Socket } from "socket.io";

const fileServer = new nodeStatic.Server();
const app = http
  .createServer(function (req, res) {
    fileServer.serve(req, res);
  })
  .listen(8080);

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
      if (args[0]?.type) {
        console.log("Client " + socket.id + " said: ", args[0]?.type);
      }
      socket.to(room).emit(ev, ...args);
    }
  };
};

io.sockets.on("connection", function (socket) {
  socket.on("message", function (message, room) {
    broadcastRoom(socket, room)("message", message);
  });

  socket.on("join", function (room) {
    // 加入房间
    socket.join(room);

    const clientsInRoom = io.sockets.adapter.rooms.get(room);
    const numClients = clientsInRoom ? clientsInRoom.size : 0;

    console.log("client " + socket.id + " join " + room, clientsInRoom);

    if (numClients === 1) {
      console.log("created");
      socket.emit("created", room);
    } else if (numClients === 2) {
      console.log("ready");
      socket.broadcast.emit("ready", room);
    } else {
      console.log(numClients, clientsInRoom);
    }
  });

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
    // console.log(`Peer or server disconnected. Reason: ${reason}.`);
    socket.broadcast.emit("bye");
  });

  socket.on("bye", function (room) {
    console.log(`Peer said bye on room ${room}.`);
    // socket.broadcast.emit("bye");
  });

  socket.on("conn", function (room) {
    console.log(socket.id + ": conn");
    broadcastRoom(socket, room)("conn");
  });
});
