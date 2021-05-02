import "./style.less";

import { defineComponent } from "@vue/runtime-core";

import { UserBar } from "./UserBar";
import { Login } from "./Login";
import { StoreState } from "@/store";
import { computed } from "vue";
import { useStore } from "vuex";
import { QUERY_USER } from "@/store/types";

export const UserInfo = defineComponent({
  name: "Login",
  setup() {
    const store = useStore<StoreState>();
    store.dispatch(QUERY_USER);

    const user = computed(() => store.state.user.base);

    return {
      user,
    };
  },
  render() {
    return (
      <div class="bar-container">
        {this.user ? <UserBar user={this.user} /> : <Login />}
      </div>
    );
  },
});
