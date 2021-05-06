import { log } from "../log";

// B：接收文件
export function receive(
  event: RTCDataChannelEvent,
  onChunk: (
    name: string,
    count: number,
    buffer?: ArrayBufferLike,
    done?: boolean
  ) => void
) {
  const channel = event.channel;

  let buf: Uint8ClampedArray;
  let name = "";

  let count = 0;

  channel.onmessage = (event) => {
    log("接收到文件信息", event.data);

    // 第一条信息，接收文件大小
    if (typeof event.data === "string") {
      const file = JSON.parse(event.data);
      name = file.name;
      buf = new Uint8ClampedArray(file.byteLength);
      count = 0;
      onChunk(name, count);
      return;
    }

    const data = new Uint8ClampedArray(event.data);
    buf.set(data, count);
    count += data.byteLength;

    const done = count === buf.byteLength;

    onChunk(name, count, buf, done);

    // 完成接收
    if (done) {
      log("接收完毕，下载文件");
    }
  };
}
