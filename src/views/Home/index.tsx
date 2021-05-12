import "./style.less";

import { computed, defineComponent, watch } from "vue";
import { message, Modal } from "ant-design-vue";
import filesize from "filesize";

import { FileTransfer } from "@/components/FileTransfer";

import { useRTC } from "@/hooks/useRTC";
import { useStateChange } from "@/hooks/useStateChange";

import { SendFile } from "./SendFile";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const {
      getCurrentUserId,
      userList,
      refresh,
      targetUserId,
      sendReceiveFileConfirm,
      transferState,
      fileinfo,
      // sendReceiveFileConfirm,
      receiveResponse,
      cancelFileTransfer,
      receivedFile,
      clear,
      confirmReceiveFile,
      changeState,
    } = useRTC();

    // const { currentUser, userList, refresh: refreshUserList } = useUser();

    // const users = computed(() =>
    //   userList.value.map((user) => ({
    //     id: user,
    //     loading: getLoading(user),
    //   }))
    // );

    const showTransfer = computed(() =>
      ["sending_file_content", "receiving_file_data"].includes(
        transferState.value
      )
    );

    // TODO: 整理为私有 hook
    const map: Record<string, string | { type: string; text: string }> = {
      received_response_reject: "用户拒绝！",
      received_cancel: "用户取消文件传输！",
      received_exit: "断开连接，文件传输失败！",
      received_success: { type: "success", text: "文件传输成功！" },
    };

    watch(transferState, (state) => {
      const info = map[state];
      if (info) {
        if (typeof info === "string") {
          message.error(info);
        } else {
          message[info.type](info.text);
        }
        clear();
      }

      // TODO: 整理为私有 hook
      if (
        state === "received_response_agree" ||
        state === "awaiting_file_content"
      ) {
        useStateChange(transferState, 5 * 1000, (changed) => {
          if (!changed) {
            message.error("创建连接失败!请重试");
            clear();
          }
        });
      }

      if (state === "awaiting_response") {
        useStateChange(transferState, 10 * 1000, (changed) => {
          if (!changed) {
            message.error("对方无响应!请重试");
            clear();
          }
        });
      }
    });

    return {
      getCurrentUserId,
      userList,
      // transfer,
      fileinfo,
      showTransfer,
      sendReceiveFileConfirm,
      // cancel,
      clear,
      confirmReceiveFile,
      // targetUser,
      // refreshUserList,
      receiveResponse,
      transferState,
      targetUserId,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div>当前用户：{this.getCurrentUserId()}</div>
        <SendFile
          users={this.userList}
          // onRefresh={this.refreshUserList}
          onFileChange={this.sendReceiveFileConfirm}
        />

        <Modal
          title="隔空投送"
          visible={this.transferState === "received_file_info"}
          onOk={() => {
            this.confirmReceiveFile(this.targetUserId);
          }}
          onCancel={() => {
            this.receiveResponse(this.targetUserId, false);
            this.clear();
          }}
          okText="同意"
          cancelText="拒绝"
        >
          <div>
            来自“{this.targetUserId}”的文件
            <div>
              {this.fileinfo.name} {filesize(this.fileinfo.size)}
            </div>
          </div>
        </Modal>

        {/* {this.showTransfer && (
          <FileTransfer
            file={this.fileinfo}
            cancel={this.cancel}
            transferred={this.transfer.transfered}
          />
        )} */}
      </div>
    );
  },
});

export default HomePage;
