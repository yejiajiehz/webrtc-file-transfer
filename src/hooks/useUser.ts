import { ref } from "vue";
import { getSocket, bindOnce } from "@/utils/socket";

// 获取当前用户和用户列表
export function useUser() {
  const currentUser = ref("");
  const userList = ref<string[]>([]);

  const socket = getSocket();

  bindOnce(socket, "P2P:join", function (userid: string) {
    currentUser.value = userid;
  });

  bindOnce(socket, "P2P:user-list", function (userlist: string[]) {
    userList.value = userlist.filter((u) => u !== currentUser.value);
  });

  return { currentUser, userList };
}
