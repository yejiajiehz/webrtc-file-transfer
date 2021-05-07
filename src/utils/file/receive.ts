import { log } from "../log";

// B：接收文件
export function receive(
  event: RTCDataChannelEvent,
  onChunk: (
    name: string,
    size: number,
    count: number,
    buffer?: ArrayBufferLike,
    done?: boolean
  ) => void
) {
  const channel = event.channel;

  let buf: Uint8ClampedArray | null;
  let file: { name: string; size: number };

  let count = 0;

  channel.onmessage = (event) => {
    log("接收到文件信息", event.data);

    // 第一条信息，接收文件大小
    if (typeof event.data === "string") {
      file = JSON.parse(event.data);
      try {
        buf = new Uint8ClampedArray(file.size);
      } catch (e) {
        buf = null;
      }
      count = 0;
      onChunk(file.name, file.size, count);
      return;
    }

    if (buf === null) return;

    const data = new Uint8ClampedArray(event.data);
    buf.set(data, count);
    count += data.byteLength;

    const done = count === buf.byteLength;

    onChunk(file.name, file.size, count, buf, done);

    // 完成接收
    if (done) {
      log("接收完毕，下载文件");
    }
  };
}
