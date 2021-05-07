export function createChannel(peerConn: RTCPeerConnection) {
  const channel = peerConn.createDataChannel("file");

  return channel;
}
