// 下载文件
export function downloadBlob(name: string, buffer: BlobPart[]) {
  const received = new Blob(buffer);

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = URL.createObjectURL(received);
  downloadAnchor.download = name;
  downloadAnchor.click();

  URL.revokeObjectURL(downloadAnchor.href);
}
