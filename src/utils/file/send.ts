import { log } from "../log";

const CHUNK_SIZE = 16 * 1024;

export async function send(
  channel: RTCDataChannel,
  file: File,
  onSendChunk?: (chunk: ArrayBuffer) => void
) {
  const { name, size } = file;

  // XXX: 目前使用 blob size，实际和 byteLength 是否相等需判断
  log("发送文件信息", { name, size });
  channel.send(JSON.stringify({ name, size }));

  async function channelSend(index = 0) {
    if (index * CHUNK_SIZE >= size) {
      return;
    }

    const chunk = file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();

    channel.send(buffer);
    onSendChunk?.(buffer);

    log("发送文件内容", buffer);

    // 大文件场景下，释放主线程
    setTimeout(() => {
      channelSend(index + 1);
    });
  }

  channelSend();

  log("完成发送");
}
