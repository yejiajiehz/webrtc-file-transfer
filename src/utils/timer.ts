// 定时器，每次调用后推
export function delayTimer(handler: () => void, time: number) {
  let clearTimeid = 0;

  return () => {
    clearTimeout(clearTimeid);
    clearTimeid = setTimeout(handler, time);
  };
}
