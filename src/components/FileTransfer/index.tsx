import { useSpeed } from "@/hooks/useSpeed";
import { Progress, Button, Popconfirm } from "ant-design-vue";
import { defineComponent, PropType } from "vue";
import fileSize from "filesize";

const FileTransfer = defineComponent({
  props: {
    file: {
      type: Object as PropType<{ name: string; size: number }>,
      required: true,
    },
    transferred: { type: Number, required: true },
    cancel: { type: Function, required: true },
  },
  setup(props) {
    const speed = useSpeed(props, "transferred");

    return {
      speed,
    };
  },
  render() {
    const { transferred } = this;
    const { name, size } = this.file;
    const downloadTime = Math.ceil((size - transferred) / this.speed / 60);
    const percent = ((transferred * 100) / size).toFixed(2);

    return (
      <div>
        <ul>
          <li>文件：{name}</li>
          <li>大小：{fileSize(size)}</li>
          <li>传输速度：{fileSize(this.speed)}/S</li>
          <li> 预计还需要： {downloadTime} 分钟</li>
        </ul>
        <Progress percent={+percent} />

        <Popconfirm title="确定取消传输？" onConfirm={() => this.cancel()}>
          <Button>取消</Button>
        </Popconfirm>
      </div>
    );
  },
});

export { FileTransfer };
