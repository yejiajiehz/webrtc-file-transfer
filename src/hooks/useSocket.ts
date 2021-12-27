import { ref, reactive, nextTick } from "vue";
import { getSocket } from "@/utils/socket";
import { log } from "@/utils/log";
import { CHUNK_SIZE } from "@/utils/file";

// 传输状态
export type TransferState =
  // 空闲状态
  | "idle"
  // A 发送文件信息
  | "sending_file_info"
  // B 接收文件信息
  | "received_file_info"
  // A 等待接收回应
  | "awaiting_response"
  // A 接收回应
  | "received_response_agree"
  | "received_response_reject"
  | "rtc_connecting"
  | "rtc_connected"
  // | "rct_disconnect"
  // B 等待文件内容
  | "awaiting_file_content"
  // A 发送文件内容
  | "sending_file_content"
  // B 接收文件内容
  | "receiving_file_content"
  // 发送取消
  | "sending_cancel"
  // 接收取消
  | "received_cancel"
  // B 发送成功消息
  | "sending_completed"
  // A 接收成功
  | "received_completed"
  // 用户退出
  | "received_exit";

type SocketMessageType =
  | "send-file-info"
  | "receive-response"
  | "cancel-transfer"
  | "received-file-data"
  | "sdp";

const defaultFileInfo = { name: "", size: 0, transferred: 0, offset: 0 };

export function useSocket(handleSDP: (data: any) => void) {
  const socket = getSocket();

  // 用户列表
  const userList = ref<string[]>([]);
  // 联通对象
  const targetUser = ref("");
  // 传输状态
  const transferState = ref<TransferState>("idle");
  // 文件信息
  const fileInfo = reactive(defaultFileInfo);

  /* 用户相关 */
  function getCurrentUser() {
    return socket.id;
  }

  // 获取用户列表
  socket.on("P2P:user-list", function (users: string[]) {
    userList.value = users;
  });

  // 刷新用户列表
  const refreshUserList = () => {
    socket.emit("P2P:user-list");
  };

  // 在文件传输中退出
  socket.on("P2P:exit", function (userid: string) {
    // 连接对象退出
    const isTargetExit = userid === targetUser.value;
    // 传输中
    const transferring = [
      "sending_file_content",
      "receiving_file_content",
    ].includes(transferState.value);

    // XXX: 重试机制？传输方退出之后，理论上可以断点续传
    if (isTargetExit && transferring) {
      transferState.value = "received_exit";
      cleanup();
    }
  });

  /* 传输相关 */

  // socket 消息
  function sendMessage(type: SocketMessageType, data?: any) {
    log("socket: emit message to " + targetUser.value, type, data);
    socket.emit("message", targetUser.value, { type, data });
  }

  // 修改状态
  function changeTransferState(state: TransferState) {
    transferState.value = state;
  }

  // 发送文件信息
  function sendFileInfo(
    target: string,
    fileinfo: { name: string; size: number }
  ) {
    targetUser.value = target;
    transferState.value = "sending_file_info";
    sendMessage("send-file-info", fileinfo);
    transferState.value = "awaiting_response";
  }

  // 发送回应
  function receiveResponse(response: boolean, offset?: number) {
    sendMessage("receive-response", { response, offset });

    if (response) {
      transferState.value = "rtc_connecting";
    } else {
      cleanup();
    }
  }

  // 取消
  function cancelFileTransfer() {
    transferState.value = "sending_cancel";
    sendMessage("cancel-transfer");
  }

  // 完成文件接收
  function receivedFile() {
    transferState.value = "received_completed";
    sendMessage("received-file-data");
  }

  // 事件处理
  socket.on(
    "message",
    function (
      from: string,
      { type, data }: { type: SocketMessageType; data: any }
    ) {
      targetUser.value = from;

      log("socket: received message from " + from, type, data);
      switch (type) {
        case "send-file-info":
          transferState.value = "received_file_info";
          fileInfo.name = data.name;
          fileInfo.size = data.size;
          break;
        case "receive-response": {
          const agree = data.response === true;

          transferState.value = agree
            ? // 使用 watch 创建 rtc 连接
              "received_response_agree"
            : "received_response_reject";

          // 续传
          if (agree && data.offset) {
            fileInfo.offset = data.offset;
            fileInfo.transferred = data.offset * CHUNK_SIZE;
          }

          break;
        }
        case "received-file-data":
          transferState.value = "received_completed";
          break;
        case "cancel-transfer":
          transferState.value = "received_cancel";
          break;
        case "sdp":
          handleSDP(data);
          break;
        default:
          console.error(`Unknown message: ${type}`, data);
      }
    }
  );

  function cleanup() {
    nextTick(() => {
      transferState.value = "idle";
      targetUser.value = "";

      fileInfo.name = "";
      fileInfo.size = 0;
      fileInfo.transferred = 0;
      fileInfo.offset = 0;
    });
  }

  return {
    sendMessage,

    getCurrentUser,
    targetUser,
    userList,
    refreshUserList,

    transferState,
    fileInfo,

    sendFileInfo,
    receiveResponse,
    changeTransferState,
    cancelFileTransfer,
    receivedFile,

    cleanup,
  };
}
