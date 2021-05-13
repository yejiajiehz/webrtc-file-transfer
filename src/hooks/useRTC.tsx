import { computed, nextTick, ref, watch } from "vue";
import { downloadBlob, receive, channelSend } from "@/utils/file";

import { useSocket } from "./useSocket";
import { Peer } from "../utils/peer";
import { cache } from "@/utils/file/cache";

export function useRTC() {
  let peer: Peer;
  const file = ref<File>();

  const {
    sendMessage,
    getCurrentUser,
    userList,
    targetUser,
    refreshUserList,
    transferState,
    fileInfo,
    sendFileInfo: socketSendFileInfo,
    receiveResponse: socketReceiveResponse,
    cancelFileTransfer: socketCancelFileTransfer,
    receivedFile,
    cleanup,
    changeTransferState,
  } = useSocket((data) => peer.handleSDP(data));

  const cacheKey = computed(() => `${fileInfo.name}_${fileInfo.size}`);

  function createPeer() {
    peer = new Peer(
      undefined,
      (data?: any) => sendMessage("sdp", data),
      () => changeTransferState("rtc_connected")
    );
  }

  function sendFileInfo(userid: string, f: File) {
    file.value = f;
    const { name, size } = f;
    fileInfo.name = name;
    fileInfo.size = size;

    socketSendFileInfo(userid, { name, size });
  }

  watch(transferState, (value) => {
    // A 创建 rtc
    if (value === "received_response_agree") {
      changeTransferState("rtc_connecting");
      createPeer();

      peer.sendOffer();

      peer.channel!.onopen = function () {
        changeTransferState("sending_file_content");

        channelSend(
          (data) => this.send(data),
          file.value!,
          // 续传判断 offset
          fileInfo.offset,
          (chunk) => {
            fileInfo.transfered += chunk.byteLength;

            const isTransfering =
              transferState.value === "sending_file_content";

            return isTransfering && peer.channel?.readyState === "open";
          }
        );
      };
    }
  });

  function receiveResponse(response: boolean) {
    if (response) {
      const offset = cache.get(cacheKey.value)?.length;
      socketReceiveResponse(true, offset);
      changeTransferState("rtc_connecting");
      createPeer();

      // 接收文件
      peer.peerConn!.ondatachannel = (event) => {
        changeTransferState("awaiting_file_content");

        event.channel.onmessage = receive(cacheKey.value, (buffer, count) => {
          // 取消的情况下，不再接收数据
          if (transferState.value === "awaiting_file_content") {
            changeTransferState("receiving_file_content");
          }

          fileInfo.transfered = count;
          const received = fileInfo.transfered === fileInfo.size;

          // 设置缓存，3 分钟过期
          cache.set(cacheKey.value, buffer, 3 * 60 * 1000);

          // 下载文件
          if (received) {
            receivedFile();
            downloadBlob(fileInfo.name, buffer);

            nextTick(() => {
              clean();
            });
          }

          return received;
        });
      };
    } else {
      socketReceiveResponse(false);
    }
  }

  function cancelFileTransfer() {
    socketCancelFileTransfer();
    clean();
  }

  function clean() {
    cleanup();
    if (peer) {
      peer.clean();
    }
  }

  return {
    sendFileInfo,
    targetUser,
    getCurrentUser,
    userList,
    refreshUserList,
    transferState,
    fileInfo,
    receiveResponse,
    cancelFileTransfer,
    clean,
  };
}
