import { Socket } from "socket.io-client";

export function createPeerConnection(
  config: RTCConfiguration | undefined,
  sendMessage: (mssage: any) => void,
  onCandidate: () => void
) {
  const peerConn = new RTCPeerConnection(config);

  peerConn.onicecandidate = function (event) {
    if (event.candidate) {
      console.log("A.2 or B.3 发送 candidate", Date.now());
      sendMessage({
        type: "candidate",
        data: event.candidate.toJSON(),
      });

      onCandidate();
    }
  };

  return peerConn;
}

// 发送 offer
export async function sendOffer(
  peerConn: RTCPeerConnection,
  sendMessage: (mssage: any) => void
) {
  const offer = await peerConn.createOffer();
  console.log("A.1 发送 offer 信令（SDP）", Date.now());
  await peerConn.setLocalDescription(offer);
  sendMessage(peerConn.localDescription);
}

// 消息处理
export async function handleIceConnMessage(
  peerConn: RTCPeerConnection,
  message: any,
  sendMessage: (mssage: any) => void,
  onAddCandidate: () => void
) {
  if (!message) return;

  if (message.type === "offer") {
    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
    const desc = await peerConn.createAnswer();
    await peerConn.setLocalDescription(desc);
    sendMessage(peerConn.localDescription);
    console.log(
      "B.2 接收 offer，生成 Answer 信令（SDP）, 返回给发起端",
      Date.now()
    );
  } else if (message.type === "answer") {
    console.log("A.3 获取 answer", Date.now());
    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === "candidate") {
    console.log("A.4 or B.1 接收 candidate", Date.now());
    await peerConn.addIceCandidate(new RTCIceCandidate(message.data));
    onAddCandidate();
  }
}
