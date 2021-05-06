import "./style.less";

import { defineComponent, PropType, ref } from "vue";
import { Button, message, Modal } from "@gaoding/gd-antd-plus";

import { Upload } from "@/components/Upload";

export const ConnectBtn = defineComponent({
  name: "home",
  props: {
    onConnect: {
      type: Function as PropType<(userid: string, file: File) => void>,
      required: true,
    },
    users: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
  setup() {
    const visible = ref(false);
    // const file = ref<File>();

    return {
      visible,
      // file,
    };
  },
  render() {
    // const
    return (
      <div class="home-page">
        <Button onClick={() => (this.visible = true)}>隔空投送</Button>

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
                this.onConnect(user, files[0]);
              }}
            >
              <div>{user}</div>
            </Upload>
          ))}
        </Modal>
      </div>
    );
  },
});
