import filesize from "filesize";
import _ from "lodash";

import { log } from "../log";
import { cache } from "./cache";

// B：接收文件
export function receive(
  cacheKey: string,
  onChunk: (buffer: ArrayBuffer[], count: number) => boolean
) {
  let buf: ArrayBuffer[] | null = cache.get(cacheKey) || [];
  let count = _.sumBy(buf, "byteLength");

  if (count) {
    log(`存在缓存文件：${cacheKey}: ${filesize(count)}`);
  }

  return (event: MessageEvent) => {
    // log("接收到文件信息", event.data);

    const chunk = event.data as ArrayBuffer;
    buf!.push(chunk);
    count += chunk.byteLength;

    const done = onChunk(buf!, count);

    // 完成接收;
    if (done) {
      log("接收完毕，下载文件");
      buf = null;
    }
  };
}
