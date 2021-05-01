import { createSocket } from "./socket";
import {
  createPeerConnection,
  createIceConn,
} from "./rtc/createPeerConnection";
import { createChannel } from "./rtc/createChannel";
import { send } from "./file/send";
import { receive } from "./file/receive";

// socket 提供消息交互服务。
const { socket, sendMessage } = createSocket("roomid", () => {
  // 用户加入
  // TODO: ，展示用户列表
});

// 创建连接
socket.on("message", (message) => {
  createIceConn(peerConn, message, sendMessage);
});

var configuration = null;

const peerConn = createPeerConnection(configuration, (message) =>
  sendMessage(message)
);

const channel = createChannel(peerConn);

// A 发送文件
function setFile(file: File) {
  send(channel, file);
}

// B: 接收文件
receive(peerConn);

// 退出的时候，清理服务
window.addEventListener("unload", function () {
  peerConn.close();
  channel.close();
});
