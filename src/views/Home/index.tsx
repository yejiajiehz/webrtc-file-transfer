import "./style.less";

import { defineComponent, onMounted, ref } from "vue";
import { Button } from "@gaoding/gd-antd-plus";

import { Upload } from "@/components/Upload";

import { createSocket } from "@/utils/socket";
import {
  createPeerConnection,
  createIceConn,
} from "@/utils/rtc/createPeerConnection";
import { createChannel } from "@/utils/rtc/createChannel";
import { send } from "@/utils/file/send";
import { receive } from "@/utils/file/receive";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const file = ref<File>();

    // socket 提供消息交互服务。
    const { socket, sendMessage } = createSocket("roomid", () => {
      // 用户加入
      // TODO: ，展示用户列表
    });

    // 创建连接
    socket.on("message", (message) => {
      createIceConn(peerConn, message, sendMessage);
    });

    const configuration = undefined;

    const peerConn = createPeerConnection(configuration, (message) =>
      sendMessage(message)
    );

    const channel = createChannel(peerConn);

    // // B: 接收文件
    // receive(peerConn);

    // 退出的时候，清理服务
    window.addEventListener("unload", function () {
      peerConn.close();
      channel.close();
    });

    // A 发送文件
    function sendFile() {
      if (file.value) {
        send(channel, file.value);
      }
    }

    onMounted(() => {
      // B 接收文件
      receive(peerConn);
    });

    return {
      file,
      sendFile,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div>
          <h1>上传区域</h1>
          <Upload onChange={(files) => (this.file = files[0])}>选择文件</Upload>
          <Button onClick={this.sendFile}>发送</Button>
        </div>
        <div>
          <h1>下载区域</h1>
          <Button>下载</Button>
        </div>
      </div>
    );
  },
});

export default HomePage;
