import { log } from "@/utils/log";

export class Peer {
  emitMessage: (data: any) => void;
  peerConn: RTCPeerConnection | null = null;
  channel: RTCDataChannel | null = null;
  connectionState: RTCPeerConnectionState = "new";

  constructor(
    config: RTCConfiguration | undefined,
    emitMessage: (data: any) => void
  ) {
    this.emitMessage = emitMessage;
    this.startConnect(config);
  }

  startConnect(config?: RTCConfiguration) {
    const peerConn = new RTCPeerConnection(config);
    const channel = peerConn.createDataChannel("file");
    channel.binaryType = "arraybuffer";

    peerConn.onicecandidate = (event) => {
      if (event.candidate) {
        this.emitMessage({
          type: "candidate",
          data: event.candidate.toJSON(),
        });
      }
    };

    peerConn.onsignalingstatechange = () => {
      log("peer: connectionState change:", this.connectionState);
      this.connectionState = peerConn.connectionState;
    };

    this.peerConn = peerConn;
    this.channel = channel;
  }

  async sendOffer() {
    const peerConn = this.peerConn;

    if (peerConn) {
      const offer = await peerConn.createOffer();
      await peerConn.setLocalDescription(offer);

      this.emitMessage(peerConn.localDescription);
    }
  }

  // 消息处理
  async handleSDP(message: any) {
    if (!message) return;
    log("peer: handle sdp message", message);

    const peerConn = this.peerConn!;

    if (message.type === "offer") {
      await peerConn.setRemoteDescription(new RTCSessionDescription(message));
      const desc = await peerConn.createAnswer();
      await peerConn.setLocalDescription(desc);

      this.emitMessage(peerConn.localDescription);
    } else if (message.type === "answer") {
      await peerConn.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === "candidate") {
      await peerConn.addIceCandidate(new RTCIceCandidate(message.data));
    }
  }

  clean() {
    if (this.peerConn) {
      this.peerConn.close();
      this.peerConn = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
