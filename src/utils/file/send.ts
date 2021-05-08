import { log } from "../log";
import { CHUNK_SIZE } from "./const";

export function sendFileInfo(channel: RTCDataChannel, file: File) {
  const { name, size } = file;

  // XXX: 目前使用 blob size，实际和 byteLength 是否相等需判断
  log("发送文件信息", { name, size });
  channel.send(JSON.stringify({ name, size }));
}

export async function sendFileContent(
  channel: RTCDataChannel,
  file: File,
  offset = 0,
  onSendChunk?: (chunk: ArrayBuffer) => boolean
) {
  const { size } = file;

  async function channelSend(index = 0) {
    if (index * CHUNK_SIZE >= size) {
      return;
    }

    const chunk = file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    channel.send(buffer);
    const transfering = onSendChunk?.(buffer);

    log("发送文件内容", buffer);

    if (transfering) {
      // XXX: 大文件场景下，释放主线程?
      setTimeout(() => {
        channelSend(index + 1);
      });
    }
  }

  await channelSend(offset);
  log("完成发送");
}
