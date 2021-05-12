import { log } from "../log";
import { delayTimer } from "../timer";

// 缓存，以便断点续传
const bufferMap: Record<string, ArrayBuffer[]> = {};

// B：接收文件
export function receive(
  onChunk: (count: number, buffer: ArrayBuffer[]) => boolean
) {
  let buf: ArrayBuffer[] = [];
  // TODO: 整理到其他地方
  let file: { name: string; size: number };
  let count = 0;

  // 清理数据
  function clear() {
    buf = [];
    delete bufferMap[file.name];
  }

  // 3 分钟过期
  const delayClear = delayTimer(clear, 3 * 60 * 1000);

  return (event: MessageEvent) => {
    log("接收到文件信息", event.data);

    delayClear();

    // // 第一条信息，接收文件大小
    // if (typeof event.data === "string") {
    //   file = JSON.parse(event.data);

    //   const key = file.name + "_" + file.size;
    //   buf = bufferMap[key] || (bufferMap[key] = []);
    //   count = buf.reduce((v, b) => v + b.byteLength, 0);

    //   // 实现断线重连功能
    //   // socket.emit("P2P:file-check", userid, buf.length);
    //   emitMessage(userid, { type: "file-check", data: buf.length });

    //   onChunk(file.name, file.size, count);
    //   return;
    // }

    const chunk = event.data as ArrayBuffer;
    buf.push(chunk);
    count += chunk.byteLength;

    const done = onChunk(count, buf);

    // 完成接收;
    if (done) {
      log("接收完毕，下载文件");
      clear();
    }
  };
}
