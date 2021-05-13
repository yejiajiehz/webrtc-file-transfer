export function useCircle() {
  const height = innerHeight - 55;
  const width = innerWidth * 0.8;

  const center = {
    x: width,
    y: height / 2,
  };

  const r = height / 2;

  // 每环之间的间距
  const gutter = 200;

  return {
    r,
    center,
    gutter,
  };
}
