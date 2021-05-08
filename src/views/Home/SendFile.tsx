import "./style.less";

import { defineComponent, PropType, ref } from "vue";
import { Button, message, Spin } from "@gaoding/gd-antd-plus";

import { Upload } from "@/components/Upload";
import fileSize from "filesize";
import Card from "@gaoding/gd-antd-plus/lib/card/Card";
import { FILE_SIZE_LIMIT } from "@/utils/file";

type User = {
  id: string;
  loading: boolean;
};

export const SendFile = defineComponent({
  name: "SendFile",
  props: {
    onFileChange: {
      type: Function as PropType<(userid: string, file: File) => void>,
      required: true,
    },
    users: {
      type: Array as PropType<User[]>,
      required: true,
    },
  },
  setup() {
    const visible = ref(false);

    return {
      visible,
    };
  },
  render() {
    return (
      <div>
        <Button
          onClick={() => {
            this.visible = true;
          }}
        >
          隔空投送
        </Button>

        {this.visible && (
          <Card>
            {this.users.map((user) => (
              <Upload
                onChange={(files) => {
                  const file = files[0];
                  if (file.size > FILE_SIZE_LIMIT) {
                    message.error(
                      "发送的文件必须小于 " + fileSize(FILE_SIZE_LIMIT)
                    );
                    return;
                  }
                  this.onFileChange(user.id, file);
                }}
              >
                <Spin spinning={user.loading}>{user.id}</Spin>
              </Upload>
            ))}
          </Card>
        )}
      </div>
    );
  },
});
