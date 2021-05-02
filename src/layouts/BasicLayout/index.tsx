import "./style.less";

import { RouterView } from "vue-router";
import { LoginModal } from "@/components";

import { UserInfo } from "./UserInfo";
import { Logo } from "./Logo";

const Layout = () => {
  return (
    <div class="layout">
      <header class="layout__header">
        <div class="layout__header__logo">
          <Logo />
        </div>
        <UserInfo />
      </header>

      <div class="layout__content">
        <RouterView />
      </div>
      <LoginModal />
    </div>
  );
};

Layout.displayName = "layout";

export default Layout;
