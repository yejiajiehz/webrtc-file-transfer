import "./style.less";

import { defineComponent, ref, watch } from "vue";
import { Button, message, Modal } from "@gaoding/gd-antd-plus";

import { getSocket } from "@/utils/socket";
import {
  handleIceConnMessage,
  sendOffer,
} from "@/utils/rtc/createPeerConnection";

import { downloadBlob, receive, send } from "@/utils/file";
import { log } from "@/utils/log";
import { useRTC } from "@/hooks/useRTC";

import { ConnectBtn } from "./ConnectBtn";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const file = ref<File>();
    const downloadInfo = ref<any>({});
    const current = ref("");

    // 获取用户列表
    const users = ref<string[]>([]);

    // socket 提供消息交互服务。
    const socket = getSocket();
    socket.on("P2P:join", function (userid: string) {
      current.value = userid;
    });

    socket.on("P2P:user-list", function (userlist: string[]) {
      users.value = userlist.filter((u) => u !== current.value);
    });

    // B 接收 A 的问询
    socket.on(
      "P2P-B:receive-file",
      function (room: string, userid: string, filename: string) {
        Modal.confirm({
          title: `是否接收来自 ${userid} 的 ${filename} ?`,
          onOk() {
            // B 确定问询
            socket.emit("P2P-A:receive-file", room, userid);

            // 获取下载信息
            const { peerConn } = useRTC(room);

            peerConn.ondatachannel = (event) =>
              receive(event, (name, count, buffer, done) => {
                // TODO: 进度展示
                downloadInfo.value = {
                  name,
                  count,
                };

                if (done && buffer) {
                  downloadBlob(name, [buffer]);
                }
              });

            // 不想把 peerConn 暴露，所以分开调用
            // TODO: 多次执行怎么办？
            socket.on("P2P:ice-message", function (room, message) {
              handleIceConnMessage(peerConn, room, message);
            });
          },
          onCancel() {
            // 不接受文件
            socket.emit("P2P-A:refuse-file", userid);
          },
        });
      }
    );

    // A 连接 ready
    socket.on("P2P-A:ready", async function (room: string) {
      // TODO: 如果已经存在连接，是否能够复用？
      // 创建 rtc 连接
      const { peerConn, channel } = useRTC(room, (state) => {
        if (state === "open") {
          send(channel, file.value!);
          // TODO: 进度动画
        }
      });

      // TODO: 多次执行怎么办？
      socket.on("P2P:ice-message", function (room: string, message: any) {
        handleIceConnMessage(peerConn, room, message);
      });

      await sendOffer(peerConn, room);
    });

    // B 拒绝接收文件
    socket.on("P2P-A:refuse-file", function (userid: string) {
      message.error(`用户 ${userid} 拒绝了发送文件请求！`);
      // TODO: 是否要关闭弹窗？
    });

    socket.on("P2P:exit", (userid: string) => {
      log(`用户 ${userid} 退出!`);

      // 销毁 Conn 和 channel
      // if (peerConn) peerConn.close();
      // if (channel) channel.close();

      // TODO: 重试机制
    });

    // A 向 B 发起接收文件问询
    const onConnect = (userid: string, f: File) => {
      file.value = f;

      socket.emit("P2P-B:receive-file", userid, f.name);

      // TODO: loading 状态
      // TODO: 超时机制，提示用户，并关闭弹窗？
    };

    return {
      current,
      users,
      onConnect,
      downloadInfo,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div> {this.current}</div>
        <ConnectBtn users={this.users} onConnect={this.onConnect} />

        <div>
          {this.downloadInfo.name}
          {this.downloadInfo.count}
        </div>
      </div>
    );
  },
});

export default HomePage;
