import { log } from "../log";

// B：接收文件
export function receive(
  event: RTCDataChannelEvent,
  onChunk: (
    name: string,
    size: number,
    count: number,
    buffer?: ArrayBuffer[],
    done?: boolean
  ) => void
) {
  const channel = event.channel;

  let buf: ArrayBuffer[] = [];
  let file: { name: string; size: number };
  let count = 0;

  channel.onmessage = (event) => {
    log("接收到文件信息", event.data);

    // 第一条信息，接收文件大小
    if (typeof event.data === "string") {
      file = JSON.parse(event.data);
      count = 0;
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
      buf = [];
    }
  };
}
