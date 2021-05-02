import { useStore } from "vuex";
import { Button } from "@gaoding/gd-antd-plus";
import { SHOW_LOGIN_MODAL } from "@/store/types";

export const Login = () => {
  const store = useStore();
  const showLoginModal = () => store.commit(SHOW_LOGIN_MODAL);

  return (
    <div class="bar-wrapper__login">
      <Button
        style={{
          height: "36px",
        }}
        type="primary"
        onClick={showLoginModal}
      >
        登录注册
      </Button>
    </div>
  );
};
