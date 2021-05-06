import { Ref } from "vue";

import { log } from "@/utils/log";
import { createChannel } from "@/utils/rtc/createChannel";
import { createPeerConnection } from "@/utils/rtc/createPeerConnection";

export function useRTC(
  room: string,
  onStateChange?: (state: RTCDataChannelState) => void
) {
  const configuration = undefined;

  const peerConn = createPeerConnection(configuration, room);

  const channel = createChannel(peerConn);

  channel.onopen = function () {
    onStateChange?.("open");
    log("rtc channel 连接");
  };

  channel.onclose = function () {
    onStateChange?.("closed");
  };

  channel.onerror = function () {
    onStateChange?.("closed");
    // TODO: 重连机制
  };

  return { peerConn, channel };
}
