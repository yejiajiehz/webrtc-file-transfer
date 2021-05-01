export async function send(channel: RTCDataChannel, file: File) {
  if (file.size === 0) {
    return;
  }

  // 切片
  const chunkSize = 16 * 1024;
  const buffer = await file.arrayBuffer();

  // 首先传递文件整体大小
  channel.send(
    JSON.stringify({ name: file.name, byteLength: buffer.byteLength })
  );

  let offset = 0;
  let chunk = buffer.slice(offset, chunkSize);

  while (chunk.byteLength) {
    channel.send(chunk);
    offset += chunk.byteLength;

    chunk = buffer.slice(offset, chunkSize);
  }
}
