import "./style.less";

import { defineComponent, onMounted, ref, watch } from "vue";
import { Button, message } from "@gaoding/gd-antd-plus";

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

    const 创建房间 = ref(false);
    const 人齐了 = ref(false);
    const 建立连接 = ref(false);

    // socket 提供消息交互服务。
    const { socket, sendMessage } = createSocket("米奇快乐屋", (room, id) => {
      // 用户加入
      // TODO: ，展示用户列表
    });

    // 创建连接
    socket.on("message", (message) => {
      handleIceConnMessage(peerConn, message, sendMessage);

      // if (message) console.log(message);

      if (message?.type === "创建连接成功") {
        建立连接.value = true;
      }
    });

    socket.on("created", () => {
      创建房间.value = true;
    });

    socket.on("ready", () => {
      人齐了.value = true;
    });

    const configuration = undefined;

    const peerConn = createPeerConnection(configuration, (message) =>
      sendMessage(message)
    );

    const channel = createChannel(peerConn);

    watch([创建房间, 人齐了], ([a, b]) => {
      if (a) {
        console.log("创建房间成功。我是房主 a");
      }
      if (b) {
        sendOffer(peerConn, sendMessage);
      }
    });

    watch(建立连接, (v) => {
      if (v) {
        console.log("建立连接");
      }
    });

    // A 发送文件
    function sendFile() {
      if (!建立连接.value) {
        message.error("连接尚未建立");
        return;
      }

      if (file.value) {
        send(channel, file.value);
      }
    }

    const reciveInfo = ref<{ name: string; buff: ArrayBuffer }>();

    onMounted(() => {
      // B 接收文件
      receive(peerConn, (name, buff) => {
        reciveInfo.value = { name, buff };
      });
    });

    return {
      file,
      reciveInfo,
      sendFile,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div>
          <h1>上传区域</h1>
          <Upload onChange={(files) => (this.file = files[0])}>选择文件</Upload>
          {this.file && (
            <div>
              fileifo: {this.file.name} {this.file.size}
            </div>
          )}
          <Button onClick={this.sendFile}>发送</Button>
        </div>
        <div>
          <h1>下载区域</h1>
          {this.reciveInfo && (
            <Button
              onClick={() =>
                downloadBlob(this.reciveInfo!.name, [this.reciveInfo!.buff])
              }
            >
              下载文件: {this.reciveInfo.name}
            </Button>
          )}
        </div>
      </div>
    );
  },
});

export default HomePage;
