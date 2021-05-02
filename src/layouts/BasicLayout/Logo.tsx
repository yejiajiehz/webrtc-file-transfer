import { RouterLink } from "vue-router";
import logo from "@/assets/logo.svg";

export function Logo() {
  return (
    <RouterLink to="/">
      <div style={{ lineHeight: "40px" }}>
        <img src={logo} alt="稿定设计" />
      </div>
    </RouterLink>
  );
}
