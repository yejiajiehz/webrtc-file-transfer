// TODO: 剥离 UI 组件
import { message, Modal } from "@gaoding/gd-antd-plus";

import { reactive, ref } from "vue";
import { receive, downloadBlob, send } from "@/utils/file";
import { log } from "@/utils/log";
import {
  createPeerConnection,
  createChannel,
  handleIceConnMessage,
  sendOffer,
} from "@/utils/rtc";
import { getSocket } from "@/utils/socket";
import { useLoading } from "./useLoading";

// 确认的时间
const CONFIRM_TIME = 10 * 1000;
// RTC 连接时间
const RTC_CONN_TIME = 5 * 1000;

export function useRTC() {
  // 传输信息
  const transfer = reactive<{
    file: File | { name: string; size: number };
    transfering: boolean;
    transfered: number;
  }>({
    file: { name: "", size: 0 },
    transfering: false,
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

    socket.emit("P2P-A2B:ask-receive-file", userid, file.name);
  };

  // 2. B 处理 A 的发送文件请求
  socket.on(
    "P2P-A2B:ask-receive-file",
    function (userid: string, filename: string) {
      const modal = Modal.confirm({
        title: `是否接收来自 ${userid} 的 ${filename} ?`,
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
      }, CONFIRM_TIME - 500);
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
    // TODO: 时常连接不上，考虑自动重试？
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
    transfer.transfering = true;
    // 发送文件
    send(channel!, transfer.file as File, (chunk) => {
      // 传送速率
      transfer.transfered += chunk.byteLength;
    });
  }

  // 6. B 接收文件
  function receiveFile(userid: string, event: RTCDataChannelEvent) {
    transfer.transfering = true;

    // 接收文件
    receive(event, (name, size, count, buffer, done) => {
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

  // 7. A 收到 B 完成文件传送消息，关闭连接
  socket.on("P2P-B2A:receive-file-complate", function () {
    message.success("发送文件成功！");
    handlerClear();
  });

  // 退出
  socket.on("P2P:exit", (userid: string) => {
    log(`用户 ${userid} 退出!`);

    if (targetUser.value === userid) {
      // 在文件传输中退出，提示用户
      if (transfer.transfering) {
        message.error("断开连接，文件传输失败！");
        handlerClear();
      }

      // XXX: 重试机制？传输方退出之后，理论上可以断点续传
    }
  });

  // 清理连接
  function handlerClear() {
    transfer.transfering = false;
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

  // 暂停、取消方法
  function abort() {
    // TODO: abort
  }

  return {
    abort,
    getLoading,
    transfer,
    sendReceiveFileConfirm,
  };
}
