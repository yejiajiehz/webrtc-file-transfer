// TODO: 剥离 UI 组件
import { message, Modal } from "@gaoding/gd-antd-plus";

import { reactive, ref } from "vue";
import {
  receive,
  downloadBlob,
  sendFileInfo,
  sendFileContent,
  CHUNK_SIZE,
} from "@/utils/file";
import { log } from "@/utils/log";
import {
  createPeerConnection,
  createChannel,
  handleIceConnMessage,
  sendOffer,
} from "@/utils/rtc";
import { getSocket } from "@/utils/socket";
import { useLoading } from "./useLoading";
import fileSize from "filesize";

// 确认的时间
const CONFIRM_TIME = 10 * 1000;
// RTC 连接时间
const RTC_CONN_TIME = 5 * 1000;

type Transfer = {
  file: File | { name: string; size: number };
  state: "wait" | "check" | "transfering" | "cancel";
  transfered: number;
};

export function useRTC() {
  // 传输信息
  const transfer = reactive<Transfer>({
    file: { name: "", size: 0 },
    state: "wait",
    transfered: 0,
  });

  // 连接的用户
  const targetUser = ref("");

  const { getLoading, setLoading } = useLoading();

  let peerConn: RTCPeerConnection | null;
  let channel: RTCDataChannel | null;

  let confirmTimeid = 0;
  let rtcConnTimeid = 0;

  const socket = getSocket();

  // 1. A 向 B 发起接收文件请求
  const sendReceiveFileConfirm = (userid: string, file: File) => {
    setLoading(userid, true);
    transfer.file = file;

    // 异常处理：B 超时未确认
    confirmTimeid = setTimeout(() => {
      message.error(`用户 ${userid} 无响应，请重试！`);
      setLoading(userid, false);
    }, CONFIRM_TIME);

    socket.emit("P2P-A2B:ask-receive-file", userid, file.name, file.size);
  };

  // 2. B 处理 A 的发送文件请求
  socket.on(
    "P2P-A2B:ask-receive-file",
    function (userid: string, filename: string, size: number) {
      const modal = Modal.confirm({
        title: `是否接收来自 ${userid} 的 ${filename}(${fileSize(size)}) ?`,
        onOk: () => {
          clearTimeout(confirmTimeid);
          confirmReceiveFile(userid);
        },
        onCancel: () => {
          clearTimeout(confirmTimeid);
          rejectReceiveFile(userid);
        },
      });

      // 异常处理：B 长时间无反馈
      confirmTimeid = setTimeout(() => {
        modal.destroy();
        message.warning("长时间未确认，已经断开连接！");
      }, CONFIRM_TIME);
    }
  );

  // 2.1 B 同意接收
  function confirmReceiveFile(userid: string) {
    // B 确认接收
    socket.emit("P2P-B2A:answer-receive-file", userid, true);

    peerConn = createPeerConnection(undefined, userid);

    peerConn.ondatachannel = (event) => {
      clearTimeout(rtcConnTimeid);
      receiveFile(userid, event);
    };

    // 异常处理：连接不成功
    rtcConnTimeid = setTimeout(() => {
      message.error("连接不成功，请重试！");
    }, RTC_CONN_TIME);
  }

  // 2.2 B 拒绝接收
  function rejectReceiveFile(userid: string) {
    // 不接受文件
    socket.emit("P2P-B2A:answer-receive-file", userid, false);
  }

  // 3. A 接收 B 的反馈
  socket.on(
    "P2P-B2A:answer-receive-file",
    async function (userid: string, confirmed: boolean) {
      setLoading(userid, false);
      clearTimeout(confirmTimeid);

      if (confirmed) {
        createRTCConn(userid);
      } else {
        handleRejectReceiveFile(userid);
      }
    }
  );

  // 3.1 【B 同意】A 发送 offer 创建 rtc 连接
  async function createRTCConn(userid: string) {
    // A 创建 rtc 连接
    peerConn = createPeerConnection(undefined, userid);
    channel = createChannel(peerConn);

    channel.onopen = function () {
      clearTimeout(rtcConnTimeid);
      sendFile();
    };

    // 异常处理：rtc 连接不成功
    rtcConnTimeid = setTimeout(() => {
      message.error("连接不成功，请重试！");
    }, RTC_CONN_TIME);

    await sendOffer(peerConn, userid);
  }

  // 3.2 【B 拒绝】A 提醒用户
  function handleRejectReceiveFile(userid: string) {
    message.error(`用户 ${userid} 拒绝了发送文件请求！`);
  }

  // 4. A & B rtc SDP 协商
  socket.on("P2P:ice-message", function (userid, message) {
    targetUser.value = userid;

    if (peerConn) {
      handleIceConnMessage(peerConn, userid, message);
    }
  });

  // 5. A 发送文件
  function sendFile() {
    transfer.state = "check";

    // 发送文件信息
    sendFileInfo(channel!, transfer.file as File);
  }

  // 6. A 判断文件状态，断点续传
  socket.on("P2P:file-check", function (userid: string, offset: number) {
    transfer.state = "transfering";
    transfer.transfered = offset * CHUNK_SIZE;

    sendFileContent(channel!, transfer.file as File, offset, (chunk) => {
      // 传送速率
      const isTransfering = transfer.state === "transfering";
      if (isTransfering) {
        transfer.transfered += chunk.byteLength;
      }

      return isTransfering;
    });
  });

  // 7. B 接收文件信息和内容
  function receiveFile(userid: string, event: RTCDataChannelEvent) {
    transfer.state = "transfering";

    // 接收文件
    receive(event, userid, (name, size, count, buffer, done) => {
      transfer.file = { name, size };
      transfer.transfered = count;

      if (done && buffer) {
        // 6.1 B 完成文件接收
        socket.emit("P2P-B2A:receive-file-complate", userid);
        message.success("接收文件成功！");

        downloadBlob(name, buffer);
        handlerClear();
      }
    });
  }

  // 8. A 收到 B 完成文件传送消息，关闭连接
  socket.on("P2P-B2A:receive-file-complate", function () {
    message.success("发送文件成功！");
    handlerClear();
  });

  // 取消传输
  socket.on("P2P:cancel-transfer", function () {
    message.error("对方取消了文件传输！");
    transfer.state = "cancel";
  });

  // 退出
  socket.on("P2P:exit", (userid: string) => {
    log(`用户 ${userid} 退出!`);

    if (targetUser.value === userid) {
      // 在文件传输中退出，提示用户
      if (transfer.state === "transfering") {
        message.error("断开连接，文件传输失败！");
        handlerClear();
      }

      // XXX: 重试机制？传输方退出之后，理论上可以断点续传
    }
  });

  // 清理连接
  function handlerClear() {
    transfer.state = "wait";
    transfer.transfered = 0;

    if (peerConn) {
      peerConn.close();
      peerConn = null;
    }
    if (channel) {
      channel.close();
      channel = null;
    }
  }

  // 取消传输
  function cancel() {
    transfer.state = "cancel";
    socket.emit("P2P:cancel-transfer", targetUser.value);
  }

  return {
    cancel,
    getLoading,
    transfer,
    sendReceiveFileConfirm,
  };
}
