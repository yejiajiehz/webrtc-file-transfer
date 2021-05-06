import { log } from "../log";

const CHUNK_SIZE = 16 * 1024;

export async function send(channel: RTCDataChannel, file: File) {
  let buffer = await file.arrayBuffer();

  // 首先传递文件整体大小
  channel.send(
    JSON.stringify({ name: file.name, byteLength: buffer.byteLength })
  );

  log("发送文件信息", {
    name: file.name,
    byteLength: buffer.byteLength,
  });

  while (buffer.byteLength > CHUNK_SIZE) {
    const chunk = buffer.slice(0, CHUNK_SIZE);
    channel.send(chunk);
    console.log("发送文件内容", chunk);
    buffer = buffer.slice(CHUNK_SIZE);
  }

  if (buffer.byteLength) {
    channel.send(buffer);
  }

  log("完成发送");
}
