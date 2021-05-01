// B：接收文件
export function receive(peerConn: RTCPeerConnection) {
  peerConn.ondatachannel = function (event) {
    const channel = event.channel;

    let buf: Uint8ClampedArray;
    let name = "";

    let count = 0;

    channel.onmessage = (event) => {
      // 第一条信息，接收文件大小
      if (typeof event.data === "string") {
        const file = JSON.parse(event.data);
        name = file.name;
        buf = new Uint8ClampedArray(file.byteLength);
        count = 0;
        return;
      }

      var data = new Uint8ClampedArray(event.data);
      buf.set(data, count);

      count += data.byteLength;

      // 完成接收
      if (count === buf.byteLength) {
        downloadBlob(name, [buf.buffer]);

        // 关闭连接
        channel.close();
      }
    };
  };
}

// 下载文件
function downloadBlob(name: string, buffer: BlobPart[]) {
  const received = new Blob(buffer);

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = URL.createObjectURL(received);
  downloadAnchor.download = name;
  downloadAnchor.click();

  URL.revokeObjectURL(downloadAnchor.href);
}
