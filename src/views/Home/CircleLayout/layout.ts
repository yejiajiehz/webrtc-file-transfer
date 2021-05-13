import { useCircle } from "./useCircle";

const levelConfig = {
  perCount: 5,
  angles: [18, 14, 12, 9],
};

export function layout(config = levelConfig) {
  const { r, center, gutter } = useCircle();

  // TODO: 自适应处理
  return (index: number) => {
    const currIndex = index % config.perCount;
    const currLevel = (index - currIndex) / config.perCount;
    const cr = gutter * currLevel + r;

    // 角度 [0, n, -n, 2n, -2n, ...]
    const angle =
      config.angles[currLevel] *
      Math.ceil(currIndex / 2) *
      (currIndex % 2 === 0 ? -1 : 1);

    // 弧度
    const radian = (Math.PI * angle) / 180;

    // 坐标计算
    const x = center.x - Math.cos(radian) * cr;
    const y = center.y - Math.sin(radian) * cr;

    return { x, y };
  };
}
