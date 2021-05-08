export function createChannel(peerConn: RTCPeerConnection) {
  const channel = peerConn.createDataChannel("file");
  channel.binaryType = "arraybuffer";

  return channel;
}
