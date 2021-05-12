import { ref, watch } from "vue";
import { downloadBlob, receive, channelSend } from "@/utils/file";

import { useSocket } from "./useSocket";
import { Peer } from "../utils/peer";

// 确认的时间
const CONFIRM_TIME = 10 * 1000;
// RTC 连接时间
const RTC_CONN_TIME = 5 * 1000;

export function useRTC() {
  let peer: Peer;

  const file = ref<File>();

  const {
    emitMessage,
    getCurrentUserId,
    userList,
    targetUserId,
    refresh,
    transferState,
    fileinfo,
    sendFileInfo,
    receiveResponse,
    // sendFileContent,
    cancelFileTransfer,
    receivedFile,
    cleanup,
    changeState,
  } = useSocket((data) => {
    peer.handleSDP(data);
  });

  function sendReceiveFileConfirm(userid: string, f: File) {
    file.value = f;
    const { name, size } = f;

    sendFileInfo(userid, { name, size });
  }

  watch(transferState, (value) => {
    // A 创建 rtc
    if (value === "received_response_agree") {
      peer = new Peer(undefined, (data?: any) => {
        emitMessage(targetUserId.value, "sdp", data);
      });

      peer.sendOffer();

      peer.channel!.onopen = function () {
        changeState("sending_file_content");

        // TODO: 续传判断 offset
        // file.transfered = offset * CHUNK_SIZE;

        channelSend(
          (data) => this.send(data),
          file.value!,
          0,
          (chunk) => {
            // // TODO: 传送速率
            // const isTransfering = transfer.state === "transfering";
            // if (isTransfering) {
            //   transfer.transfered += chunk.byteLength;
            // }
            return transferState.value === "sending_file_content";
          }
        );
      };
    }
  });

  // B 同意接收
  function confirmReceiveFile(userid: string) {
    receiveResponse(userid, true);
    peer = new Peer(undefined, (data?: any) => {
      emitMessage(targetUserId.value, "sdp", data);
    });

    // 接收文件
    peer.peerConn!.ondatachannel = (event) => {
      event.channel.onmessage = receive((count, buffer) => {
        fileinfo.transfered += count;
        const received = fileinfo.transfered === fileinfo.size;

        // 下载文件
        if (received) {
          changeState("received_success");
          downloadBlob(fileinfo.name, buffer);
          clear();
        }

        return received;
      });
    };
  }

  function clear() {
    cleanup();
    peer.clean();
  }

  return {
    sendReceiveFileConfirm,
    targetUserId,
    confirmReceiveFile,
    getCurrentUserId,
    userList,
    refresh,
    transferState,
    fileinfo,
    receiveResponse,
    // sendFileContent,
    cancelFileTransfer,
    receivedFile,
    clear,
    changeState,
  };
}
