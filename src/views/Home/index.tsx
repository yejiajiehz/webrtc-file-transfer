import "./style.less";

import { computed, defineComponent } from "vue";

import { FileTransfer } from "@/components/FileTransfer";

import { useRTC } from "@/hooks/useRTC";
import { useUser } from "@/hooks/useUser";

import { SendFile } from "./SendFile";

const HomePage = defineComponent({
  name: "home",
  setup() {
    const { transfer, sendReceiveFileConfirm, getLoading } = useRTC();
    const { currentUser, userList } = useUser();

    const users = computed(() =>
      userList.value.map((user) => ({
        id: user,
        loading: getLoading(user),
      }))
    );

    return {
      currentUser,
      users,
      transfer,
      sendReceiveFileConfirm,
    };
  },
  render() {
    return (
      <div class="home-page">
        <div>{this.currentUser}</div>
        <SendFile
          users={this.users}
          onFileChange={this.sendReceiveFileConfirm}
        />

        {this.transfer.transfering && (
          <FileTransfer
            file={this.transfer.file!}
            transferred={this.transfer.transfered}
          />
        )}
      </div>
    );
  },
});

export default HomePage;
