import { log } from "@/utils/log";
import { getSocket } from "@/utils/socket";

export function createPeerConnection(
  config: RTCConfiguration | undefined,
  userid: string
) {
  const peerConn = new RTCPeerConnection(config);

  peerConn.onicecandidate = function (event) {
    if (event.candidate) {
      const socket = getSocket();
      socket.emit("P2P:ice-message", userid, {
        type: "candidate",
        data: event.candidate.toJSON(),
      });
      log("A.2 or B.3 发送 candidate", Date.now());
    }
  };

  peerConn.onconnectionstatechange = function (e) {
    log("connectionState", this.connectionState);
  };

  return peerConn;
}

// 发送 offer
export async function sendOffer(peerConn: RTCPeerConnection, userid: string) {
  const offer = await peerConn.createOffer();
  await peerConn.setLocalDescription(offer);

  log("A.1 发送 offer 信令（SDP）", Date.now());
  const sokcet = getSocket();
  sokcet.emit("P2P:ice-message", userid, peerConn.localDescription);
}

// 消息处理
export async function handleIceConnMessage(
  peerConn: RTCPeerConnection,
  userid: string,
  message: any
) {
  if (!message) return;

  if (message.type === "offer") {
    log("B.2 接收 offer，生成 Answer 信令（SDP）, 返回给发起端", Date.now());
    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
    const desc = await peerConn.createAnswer();
    await peerConn.setLocalDescription(desc);

    const socket = getSocket();
    socket.emit("P2P:ice-message", userid, peerConn.localDescription);
  } else if (message.type === "answer") {
    log("A.3 获取 answer", Date.now());

    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === "candidate") {
    log("A.4 or B.1 接收 candidate", Date.now());

    await peerConn.addIceCandidate(new RTCIceCandidate(message.data));
  }
}
