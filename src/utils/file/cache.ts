import { delayTimer } from "../timer";

// 缓存，以便断点续传
const bufferMap: Record<string, ArrayBuffer[]> = {};
// 延迟清理
const clearMap: Record<string, () => void> = {};

export const cache = {
  get(key: string) {
    return bufferMap[key];
  },

  set(key: string, data: ArrayBuffer[], time?: number) {
    bufferMap[key] = data;

    // 过期
    if (time) {
      const delayClear = (clearMap[key] =
        clearMap[key] || delayTimer(() => cache.remove(key), time));
      delayClear();
    }
  },

  remove(key: string) {
    delete bufferMap[key];
  },
};
