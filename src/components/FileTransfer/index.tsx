import { Progress } from "@gaoding/gd-antd-plus";
import fileSize from "filesize";

const FileTransfer = (props: {
  file: {
    name: string;
    size: number;
  };

  transferred: number;
}) => {
  const { name, size } = props.file;
  const percent = ((props.transferred * 100) / size).toFixed(2);

  return (
    <div>
      <div>
        {name}: {fileSize(size)}
      </div>
      <Progress percent={+percent} />
    </div>
  );
};

export { FileTransfer };
