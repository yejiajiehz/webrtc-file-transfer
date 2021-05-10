import { createApp } from "vue";
import App from "./App";
import router from "./router";
import store from "./store";
import "ant-design-vue/dist/antd.css";

import { catchGlobalPromiseError } from "@/utils/errorHandler";

const app = createApp(App);
app.use(store).use(router).mount("#app");

catchGlobalPromiseError();
