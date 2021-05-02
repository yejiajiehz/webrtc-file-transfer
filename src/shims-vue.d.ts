/* eslint-disable */
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

import { Store } from "vuex";
import { StoreState } from "@/store";
declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: Store<StoreState>;
  }
}
