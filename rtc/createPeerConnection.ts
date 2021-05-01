export function createPeerConnection(
  config: RTCConfiguration,
  sendMessage: (mssage: any) => void
) {
  const peerConn = new RTCPeerConnection(config);

  peerConn.onicecandidate = function (event) {
    if (event.candidate) {
      // 4. A 发送 candidate
      // 6. B 发送 candidate
      sendMessage({
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    } else {
      console.log("End of candidates.");
    }
  };

  // 1. A 发送 offer
  (async () => {
    const offer = await peerConn.createOffer();
    peerConn.setLocalDescription(offer);
    sendMessage(peerConn.localDescription);
  })();

  return peerConn;
}

// 消息处理
export async function createIceConn(
  peerConn: RTCPeerConnection,
  message: any,
  sendMessage: (mssage: any) => void
) {
  if (message.type === "offer") {
    // 2. B 接收 offer，生成 Answer 信令（SDP）, 返回给发起端
    peerConn.setRemoteDescription(new RTCSessionDescription(message));
    const desc = await peerConn.createAnswer();
    await peerConn.setLocalDescription(desc);
    sendMessage(peerConn.localDescription);
  } else if (message.type === "answer") {
    // 3. A 接收 answer
    peerConn.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === "candidate") {
    // 5. B 添加 candidate
    // 7. A 添加 candidate
    peerConn.addIceCandidate(
      new RTCIceCandidate({
        candidate: message.candidate,
        sdpMLineIndex: message.label,
        sdpMid: message.id,
      })
    );
  }
}
