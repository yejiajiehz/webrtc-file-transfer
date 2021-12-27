import "./style.less";

import { computed, defineComponent } from "vue";
import { Modal } from "ant-design-vue";
import filesize from "filesize";

import { FileTransfer } from "@/components/FileTransfer";

import { useRTC } from "@/hooks/useRTC";
import { watchTransferState } from "./watchTransferState";

import { SendFile } from "./SendFile";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const {
      getCurrentUser,
      userList,
      refreshUserList,
      targetUser,
      sendFileInfo,
      transferState,
      fileInfo,
      cancelFileTransfer,
      clean,
      receiveResponse,
    } = useRTC();

    watchTransferState(transferState, clean);

    const transferring = computed(() =>
      ["sending_file_content", "receiving_file_content"].includes(
        transferState.value
      )
    );

    const canSendFile = computed(() => transferState.value === "idle");

    return {
      transferState,
      transferring,
      canSendFile,

      targetUser,
      fileInfo,
      userList,

      getCurrentUser,
      refreshUserList,

      // 取消
      cancelFileTransfer,
      // 回应
      receiveResponse,
      sendFileInfo,
    };
  },
  render() {
    const currentUser = this.getCurrentUser();
    const users = this.userList.filter((u) => u !== currentUser);

    return (
      <div class="home-page">
        <div>当前用户：{this.getCurrentUser()}</div>

        <SendFile
          activated={this.targetUser}
          canSendFile={this.canSendFile}
          users={users}
          onRefresh={this.refreshUserList}
          onFileChange={this.sendFileInfo}
          currentUser={currentUser}
        />

        <Modal
          title="隔空投送"
          visible={this.transferState === "received_file_info"}
          onOk={() => {
            this.receiveResponse(true);
          }}
          onCancel={() => {
            this.receiveResponse(false);
          }}
          okText="同意"
          cancelText="拒绝"
        >
          <div>
            来自“{this.targetUser}”的文件
            <div>
              {this.fileInfo.name} {filesize(this.fileInfo.size)}
            </div>
          </div>
        </Modal>

        {this.transferring && (
          <FileTransfer
            file={this.fileInfo}
            cancel={this.cancelFileTransfer}
            transferred={this.fileInfo.transferred}
          />
        )}
      </div>
    );
  },
});

export default HomePage;
