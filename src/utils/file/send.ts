export async function send(channel: RTCDataChannel, file: File) {
  if (file.size === 0) {
    return;
  }

  // 切片
  const chunkSize = 16 * 1024;
  let buffer = await file.arrayBuffer();

  // if (channel.readyState !== "open") {
  //   console.error("连接未打开");
  //   return;
  // }

  // 首先传递文件整体大小
  channel.send(
    JSON.stringify({ name: file.name, byteLength: buffer.byteLength })
  );

  console.log("发送文件信息", {
    name: file.name,
    byteLength: buffer.byteLength,
  });

  while (buffer.byteLength > chunkSize) {
    const chunk = buffer.slice(0, chunkSize);
    channel.send(chunk);
    console.log("发送文件内容", chunk);
    buffer = buffer.slice(chunkSize);
  }

  if (buffer.byteLength) {
    channel.send(buffer);
  }
  console.log("完成发送");
}
