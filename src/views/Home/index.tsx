import "./style.less";

import { computed, defineComponent } from "vue";

import { FileTransfer } from "@/components/FileTransfer";

import { useRTC } from "@/hooks/useRTC";
import { useUser } from "@/hooks/useUser";

import { SendFile } from "./SendFile";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const { transfer, sendReceiveFileConfirm, getLoading, cancel } = useRTC();
    const { currentUser, userList, refresh: refreshUserList } = useUser();

    const users = computed(() =>
      userList.value.map((user) => ({
        id: user,
        loading: getLoading(user),
      }))
    );

    const showTransfer = computed(() => transfer.state === "transfering");

    return {
      currentUser,
      users,
      transfer,
      showTransfer,
      sendReceiveFileConfirm,
      cancel,
      refreshUserList,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div>{this.currentUser}</div>
        <SendFile
          users={this.users}
          onRefresh={this.refreshUserList}
          onFileChange={this.sendReceiveFileConfirm}
        />

        {this.showTransfer && (
          <FileTransfer
            file={this.transfer.file!}
            cancel={this.cancel}
            transferred={this.transfer.transfered}
          />
        )}
      </div>
    );
  },
});

export default HomePage;
