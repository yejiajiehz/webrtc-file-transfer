import { createApp } from "vue";
import App from "./App";
import router from "./router";
import store from "./store";
import "./styles/global.less";
import "@gaoding/gd-antd-plus/dist/antd.css";

import { catchGlobalPromiseError } from "@/utils/errorHandler";

const app = createApp(App);
app.use(store).use(router).mount("#app");

// catchGlobalPromiseError();
