import "./style.less";

import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { Button, message, Spin } from "@gaoding/gd-antd-plus";

import { Upload } from "@/components/Upload";

import { createSocket } from "@/utils/socket";
import {
  createPeerConnection,
  handleIceConnMessage,
  sendOffer,
} from "@/utils/rtc/createPeerConnection";

import { createChannel } from "@/utils/rtc/createChannel";
import { send } from "@/utils/file/send";
import { downloadBlob, receive } from "@/utils/file/receive";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const file = ref<File>();

    // 发起方
    const isInitiator = ref(false);

    const 人齐了 = ref(false);
    const A建立连接 = ref(false);
    const B建立连接 = ref(false);

    const room = "米奇快乐屋";
    // socket 提供消息交互服务。
    const { socket, sendMessage } = createSocket(room);

    // 如果是创建房间，认为是发起方
    socket.on("created", () => {
      isInitiator.value = true;
      console.log("创建房间成功。我是房主 A");
    });

    socket.on("ready", () => {
      console.log("ready");
      // TODO: 考虑一方退出，重新加入的情况。如何处理房主？？
      isInitiator.value = true;

      人齐了.value = true;
    });

    // 创建连接
    socket.on("message", (message) => {
      handleIceConnMessage(peerConn, message, sendMessage, () => {
        if (isInitiator.value) {
          A建立连接.value = true;
          socket.emit("conn", room);
        }
      });
    });

    socket.on("conn", () => {
      if (isInitiator.value) {
        B建立连接.value = true;
      } else {
        A建立连接.value = true;
      }
    });

    socket.on("bye", () => {
      console.log("有人退出。。。");
      人齐了.value = false;
      A建立连接.value = false;
      B建立连接.value = false;
      建立连接.value = false;

      // 销毁 Conn 和 channel
      peerConn.close();
      channel.close();
      isInitiator.value = false;

      ({ peerConn, channel } = init());
    });

    onMounted(() => {
      socket.open();
    });

    onUnmounted(() => {
      socket.emit("bye", room);
      socket.close();
    });

    function init() {
      const configuration = undefined;

      const peerConn = createPeerConnection(
        configuration,
        (message) => sendMessage(message),
        () => {
          if (!isInitiator.value) {
            B建立连接.value = true;
            socket.emit("conn", room);
          }
        }
      );

      const channel: RTCDataChannel = createChannel(peerConn);

      peerConn.onconnectionstatechange = function (ev) {
        if (
          this.connectionState === "connected" &&
          channel.readyState === "open"
        ) {
          建立连接.value = true;
          console.log("rtc peerConn 连接");
        }
      };

      channel.onopen = function () {
        建立连接.value = true;
        // TODO: 某些情况下，channel 不正确
        console.log("rtc channel 连接");
        // TODO: 重连机制
      };

      return { peerConn, channel };
    }

    let { peerConn, channel } = init();

    watch(人齐了, (v) => {
      if (v) {
        console.log("人齐了, 发 offer");
        sendOffer(peerConn, sendMessage);
      }
    });

    watch([A建立连接, B建立连接], ([a, b]) => {
      if (a) {
        console.log("A建立连接");
      }
      if (b) {
        console.log("B建立连接");
      }
      if (a && b) {
        console.log("A & B 建立连接");

        // B 接收文件
        receive(peerConn, (name, buff) => {
          reciveInfo.value = { name, buff };
        });
      }
    });

    // A 发送文件
    function sendFile() {
      if (!A建立连接.value) {
        message.error("连接尚未建立");
        return;
      }

      if (file.value) {
        send(channel, file.value);
      }
    }

    const reciveInfo = ref<{ name: string; buff: ArrayBuffer }>();

    const 建立连接 = ref(false); //computed(() => A建立连接.value && B建立连接.value);

    return {
      join: () => socket.emit("join", room),
      file,
      reciveInfo,
      sendFile,
      创建房间: isInitiator,
      建立连接,
    };
  },
  render() {
    const 我是发送方 = this.创建房间;

    return (
      <div class="home-page">
        {!this.建立连接 && <Button onClick={this.join}>建立连接</Button>}

        {this.建立连接 ? (
          <div>
            {我是发送方 ? (
              <div>
                <h1>上传区域</h1>
                <Upload onChange={(files) => (this.file = files[0])}>
                  选择文件
                </Upload>
                {this.file && (
                  <div>
                    fileifo: {this.file.name} {this.file.size}
                  </div>
                )}
                <Button onClick={this.sendFile}>发送</Button>
              </div>
            ) : (
              <div>
                <h1>下载区域</h1>
                {this.reciveInfo && (
                  <Button
                    onClick={() =>
                      downloadBlob(this.reciveInfo!.name, [
                        this.reciveInfo!.buff,
                      ])
                    }
                  >
                    下载文件: {this.reciveInfo.name}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <Spin spinning={!this.建立连接}></Spin>
        )}
      </div>
    );
  },
});

export default HomePage;

/**
 * 1. A 创建房间，created
 * 2. B 加入房间，ready
 * 3. A, B 连接成功，conn
 * 4. A, B 退出，回到初始状态
 */
