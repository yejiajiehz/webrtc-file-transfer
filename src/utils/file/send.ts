import { log } from "../log";
import { CHUNK_SIZE } from "./const";

// export function sendFileInfo(send: (data: string) => void, file: File) {
//   const { name, size } = file;

//   // XXX: 目前使用 blob size，实际和 byteLength 是否相等需判断
//   log("发送文件信息", { name, size });
//   send(JSON.stringify({ name, size }));
// }

export async function channelSend(
  send: (data: ArrayBuffer) => void,
  file: File,
  offset = 0,
  onSendChunk?: (chunk: ArrayBuffer, done?: boolean) => boolean
) {
  const { size } = file;

  async function channelSend(index = 0) {
    const start = index * CHUNK_SIZE;
    const end = Math.min((index + 1) * CHUNK_SIZE, size);

    const chunk = file.slice(start, end);
    const buffer = await chunk.arrayBuffer();

    const done = end === file.size;
    const transfering = onSendChunk?.(buffer, done);
    const canSend = transfering !== false;

    if (canSend) {
      if (buffer.byteLength) {
        // log("发送文件内容", buffer);
        send(buffer);

        // XXX: 大文件场景下，释放主线程?
        setTimeout(() => {
          channelSend(index + 1);
        });
      }
    } else {
      log("取消传输");
    }

    if (done) {
      log("完成发送");
      return;
    }
  }

  await channelSend(offset);
}
