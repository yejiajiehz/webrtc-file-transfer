export function createPeerConnection(
  config: RTCConfiguration | undefined,
  sendMessage: (mssage: any) => void
) {
  const peerConn = new RTCPeerConnection(config);

  peerConn.onicecandidate = function (event) {
    if (event.candidate) {
      // 4. A 发送 candidate
      console.log("A.2 or B.3 发送 candidate", Date.now());
      sendMessage({
        type: "candidate",
        data: event.candidate.toJSON(),
      });
    } else {
      console.log("End of candidates.", Date.now());
      sendMessage({ type: "创建连接成功" });
    }
  };

  return peerConn;
}

// a1 Alice创建了一个RTCPeerConnection对象。
// a2 Alice使用RTCPeerConnection的createOffer()方法创建了一个offer（一个SDP会话描述文本）。
// a3 Alice调用setLocalDescription()将她的offer设置为本地描述。
// a4 Alice把offer转换为字符串，并使用 信令机制 将其发送给Eve。

// b1 Eve对Alice的offer调用setRemoteDescription()函数，为了让他的RTCPeerConnection知道Alice的设置。
// b2 Eve调用createAnswer()函数创建answer。
// b3 Eve通过调用setLocalDescription()将她的answer设置为本地描述。
// b4 Eve使用 信令机制 把她字符串化的的answer传给Alice。

// a5 Alice使用setRemoteDescription()函数将Eve的answer设置为远程会话描述

export async function sendOffer(
  peerConn: RTCPeerConnection,
  sendMessage: (mssage: any) => void
) {
  // A.1 发送 offer
  const offer = await peerConn.createOffer();
  console.log("A.1 发送 offer", Date.now());
  await peerConn.setLocalDescription(offer);

  sendMessage(123);
  sendMessage(peerConn.localDescription);
}

// 消息处理
export async function handleIceConnMessage(
  peerConn: RTCPeerConnection,
  message: any,
  sendMessage: (mssage: any) => void
) {
  if (!message) return;

  if (message.type === "offer") {
    // B.1 接收 offer，生成 Answer 信令（SDP）, 返回给发起端
    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
    const desc = await peerConn.createAnswer();
    await peerConn.setLocalDescription(desc);
    sendMessage(peerConn.localDescription);
    console.log(
      "B.2 接收 offer，生成 Answer 信令（SDP）, 返回给发起端",
      Date.now()
    );
  } else if (message.type === "answer") {
    // A.2 接收 answer
    console.log("A.3 获取 answer", Date.now());
    await peerConn.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === "candidate") {
    console.log("A.4 or B.1 add candidate", Date.now());
    await peerConn.addIceCandidate(new RTCIceCandidate(message.data));
  }
}
