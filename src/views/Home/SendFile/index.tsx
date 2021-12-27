import "./style.less";

import { defineComponent, PropType, ref } from "vue";
import { Button, message, Upload, Avatar, Drawer } from "ant-design-vue";

import fileSize from "filesize";
import { FILE_SIZE_LIMIT } from "@/utils/file";
import { CircleLayout, layout } from "../CircleLayout";
import classNames from "classnames";

export const SendFile = defineComponent({
  name: "SendFile",
  props: {
    activated: String,
    canSendFile: Boolean,
    onFileChange: {
      type: Function as PropType<(userid: string, file: File) => void>,
      required: true,
    },
    onRefresh: {
      type: Function as PropType<() => void>,
      // required: true,
    },
    users: {
      type: Array as PropType<string[]>,
      required: true,
    },
    currentUser: String,
  },
  setup() {
    const visible = ref(false);
    const layoutPosition = layout();

    return {
      layoutPosition,
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

        <Drawer
          title="WiFi传输"
          width="80%"
          visible={this.visible}
          class="transfer"
          onClose={() => {
            this.visible = false;
          }}
        >
          <CircleLayout />
          <div class="user-list">
            {this.users.map((user, index) => {
              const { x, y } = this.layoutPosition(index);

              // TODO: 做一个出现效果
              return (
                <div
                  class="avatar"
                  style={{
                    top: y + "px",
                    left: x + "px",
                  }}
                >
                  <Upload
                    disabled={!this.canSendFile}
                    showUploadList={false}
                    beforeUpload={(file: File) => {
                      if (file.size > FILE_SIZE_LIMIT) {
                        message.error(
                          "发送的文件必须小于 " + fileSize(FILE_SIZE_LIMIT)
                        );
                        return;
                      }
                      this.onFileChange(user, file);
                      return false;
                    }}
                  >
                    {/* TODO: 如果是接收中，展示文件信息 */}
                    <div
                      class={classNames({ activated: this.activated === user })}
                    >
                      <Avatar />
                      <div>{user}</div>
                    </div>
                  </Upload>
                </div>
              );
            })}
          </div>

          {/* 当前用户 */}
          <div
            class="cu"
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              width: "100px",
            }}
          >
            <Avatar />
            <div class="name">{this.currentUser}</div>
          </div>
          <Button onClick={this.onRefresh}>刷新</Button>
        </Drawer>
      </div>
    );
  },
});
