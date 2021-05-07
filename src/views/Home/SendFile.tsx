import "./style.less";

import { defineComponent, PropType, ref } from "vue";
import { Button, Modal, Spin } from "@gaoding/gd-antd-plus";

import { Upload } from "@/components/Upload";

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

        <Modal
          visible={this.visible}
          onCancel={() => {
            this.visible = false;
          }}
          onOk={() => {
            this.visible = false;
          }}
        >
          {this.users.map((user) => (
            <Upload
              onChange={(files) => {
                this.onFileChange(user.id, files[0]);
              }}
            >
              <Spin spinning={user.loading}>{user.id}</Spin>
            </Upload>
          ))}
        </Modal>
      </div>
    );
  },
});
