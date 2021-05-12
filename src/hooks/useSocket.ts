import { ref, reactive } from "vue";
import { getSocket } from "@/utils/socket";
import { log } from "@/utils/log";

// 传输状态
type TransferState =
  | ""
  // A 发送文件信息
  | "sending_file_info"
  // B 接收文件信息
  | "received_file_info"
  // A 等待接收回应
  | "awaiting_response"
  // A 接收回应
  | "received_response_agree"
  | "received_response_reject"
  // B 等待文件内容
  | "awaiting_file_content"
  // A 发送文件内容
  | "sending_file_content"
  // B 接收文件内容
  | "receiving_file_data"
  // 发送取消
  | "sending_cancel"
  // 接收取消
  | "received_cancel"
  // B 发送成功
  | "sending_success"
  // A 接收成功
  | "received_success"
  | "received_exit";

// A: 发送文件信息、接收回应、发送文件内容、完成接收
// B: 接收文件信息、发送回应、接收文件内容、完成接收

type SocketMessageType =
  | "send-file-info"
  | "receive-response"
  | "send-file-content"
  | "cancel-ransfer"
  | "received-file-data"
  | "sdp";

const defaultFileInfo = { name: "", size: 0, transfered: 0 };

export function useSocket(handleSDP: (data: any) => void) {
  const socket = getSocket();

  const userList = ref<string[]>([]);
  const targetUserId = ref("");

  const transferState = ref<TransferState>("");
  const fileInfo = reactive(defaultFileInfo);

  /* 用户相关 */
  function getCurrentUserId() {
    return socket.id;
  }

  // 获取用户列表
  socket.on("P2P:user-list", function (users: string[]) {
    userList.value = users;
  });

  const refresh = () => {
    socket.emit("P2P:user-list");
  };

  // 在文件传输中退出
  socket.on("P2p:exit", function (userid: string) {
    if (userid === targetUserId.value) {
      if (transferState.value === "sending_file_content") {
        transferState.value = "received_exit";
        cleanup();
        // XXX: 重试机制？传输方退出之后，理论上可以断点续传
      }
    }
  });

  /* 传输相关 */

  function emitMessage(userid: string, type: SocketMessageType, data?: any) {
    log("socket: emit message to " + userid, type, data);
    socket.emit("message", userid, { type, data });
  }

  // 发送文件信息
  function sendFileInfo(
    target: string,
    fileinfo: { name: string; size: number }
  ) {
    targetUserId.value = target;
    transferState.value = "sending_file_info";
    emitMessage(target, "send-file-info", fileinfo);
    transferState.value = "awaiting_response";
  }

  // 发送回应
  function receiveResponse(from: string, response: boolean) {
    transferState.value = "awaiting_file_content";
    emitMessage(from, "receive-response", response);
  }

  function changeState(state: TransferState) {
    transferState.value = state;
  }

  // 取消
  function cancelFileTransfer(userid: string) {
    transferState.value = "sending_cancel";
    emitMessage(userid, "cancel-ransfer");
  }

  // 完成接收
  function receivedFile() {
    transferState.value = "received_success";
  }

  // 事件处理
  socket.on(
    "message",
    function (
      from: string,
      { type, data }: { type: SocketMessageType; data: any }
    ) {
      targetUserId.value = from;

      log("socket: received message from " + from, type, data);
      switch (type) {
        case "send-file-info":
          transferState.value = "received_file_info";
          fileInfo.name = data.name;
          fileInfo.size = data.size;
          break;
        case "receive-response":
          transferState.value =
            data === true
              ? "received_response_agree"
              : "received_response_reject";
          // TODO: 传递内存中是否已经有保存的文件，复用续传

          // 使用 watch 创建 rtc 连接
          break;
        case "send-file-content":
          transferState.value = "receiving_file_data";
          // TODO: 剥离？？
          fileInfo.transfered += data;
          break;
        case "received-file-data":
          transferState.value = "received_success";
          break;
        case "cancel-ransfer":
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
    transferState.value = "";
    Object.assign(fileInfo, defaultFileInfo);
  }

  return {
    emitMessage,

    getCurrentUserId,
    targetUserId,
    userList,
    refresh,

    transferState,
    fileinfo: fileInfo,

    sendFileInfo,
    receiveResponse,
    changeState,
    cancelFileTransfer,
    receivedFile,

    cleanup,
  };
}
