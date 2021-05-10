import { log } from "../log";
import { getSocket } from "../socket";
import { delayTimer } from "../timer";

// 缓存，以便断点续传
const bufferMap: Record<string, ArrayBuffer[]> = {};

// B：接收文件
export function receive(
  event: RTCDataChannelEvent,
  userid: string,
  onChunk: (
    name: string,
    size: number,
    count: number,
    buffer?: ArrayBuffer[],
    done?: boolean
  ) => void
) {
  const socket = getSocket();

  let buf: ArrayBuffer[] = [];
  let file: { name: string; size: number };
  let count = 0;

  // 清理数据
  function clear() {
    buf = [];
    delete bufferMap[file.name];
  }

  // 五分钟过期
  const delayClear = delayTimer(clear, 5 * 60 * 1000);

  event.channel.onmessage = (event) => {
    log("接收到文件信息", event.data);

    delayClear();

    // 第一条信息，接收文件大小
    if (typeof event.data === "string") {
      file = JSON.parse(event.data);

      const key = file.name + "_" + file.size;
      buf = bufferMap[key] || (bufferMap[key] = []);
      count = buf.reduce((v, b) => v + b.byteLength, 0);

      // 实现断线重连功能
      socket.emit("P2P:file-check", userid, buf.length);

      onChunk(file.name, file.size, count);
      return;
    }

    const chunk = event.data as ArrayBuffer;
    buf.push(chunk);
    count += chunk.byteLength;

    const done = count === file.size;

    onChunk(file.name, file.size, count, buf, done);

    // 完成接收;
    if (done) {
      log("接收完毕，下载文件");
      clear();
    }
  };
}
