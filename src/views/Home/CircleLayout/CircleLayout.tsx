import "./style.less";

import _ from "lodash";
import { useCircle } from "./useCircle";

export function CircleLayout(props: { count?: number }) {
  const circelCount = props.count || 4;

  const { r: baseR, center, gutter } = useCircle();

  return (
    <svg
      class="circles"
      style={{ transformOrigin: `${center.x}px ${center.y}px` }}
    >
      {_.range(0, circelCount).map((index) => {
        const r = baseR + gutter * index;

        return <circle class="circle" cx={center.x} cy={center.y} r={r} />;
      })}
      <path stroke="red" d={`M${center.x} ${center.y} H 0`} />
    </svg>
  );
}

CircleLayout.props = ["count"];
