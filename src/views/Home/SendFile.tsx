import "./style.less";

import { defineComponent, PropType, ref } from "vue";
import { Button, message, Spin, Card, Upload } from "ant-design-vue";

import fileSize from "filesize";
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
    onRefresh: {
      type: Function as PropType<() => void>,
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
          传输文件
        </Button>

        {this.visible && (
          <Card>
            <div class="user-list">
              {this.users.map((user) => (
                <div>
                  <Upload
                    showUploadList={false}
                    beforeUpload={(file: File) => {
                      if (file.size > FILE_SIZE_LIMIT) {
                        message.error(
                          "发送的文件必须小于 " + fileSize(FILE_SIZE_LIMIT)
                        );
                        return;
                      }
                      this.onFileChange(user.id, file);
                      return false;
                    }}
                  >
                    <Spin spinning={user.loading}>用户：{user.id}</Spin>
                  </Upload>
                </div>
              ))}
            </div>
            <Button onClick={this.onRefresh}>刷新</Button>
          </Card>
        )}
      </div>
    );
  },
});
