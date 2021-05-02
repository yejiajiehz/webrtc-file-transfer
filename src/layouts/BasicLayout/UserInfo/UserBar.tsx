import "./userbar.less";
import { oAuthClient } from "@/utils/auth/oauth2-client";
import { Avatar, Drawer, message, Popover } from "@gaoding/gd-antd-plus";
import Record from "@/views/Record/index.vue";
import Vip from "@/views/Vip/index";
import { defineComponent, PropType, ref, computed } from "vue";
import { QUERY_USER } from "@/store/types";
import { useStore } from "vuex";
import { Icon } from "@/components";
import { StoreState } from "@/store";

export const UserBar = defineComponent({
  name: "UserBar",
  props: {
    user: {
      type: Object as PropType<API.User>,
      required: true,
    },
  },
  setup() {
    const store = useStore<StoreState>();
    const visibleDrawer = ref(false);
    const nowDrawer = ref<"vip" | "record" | "">("");
    const zIndex = computed(() => {
      if (nowDrawer.value === "vip") {
        return 998;
      }
      return 1000;
    });
    return {
      store,
      zIndex,
      visibleDrawer,
      nowDrawer,
    };
  },
  render() {
    const UserBarPopoverIconStyle = {
      fontSize: "20px",
      verticalAlign: "bottom",
      marginRight: "12px",
      color: "#444950",
    };
    return (
      <div class="bar-wrapper__user">
        <div
          class="bar-wrapper__user__text bar-wrapper__user__text__history"
          onClick={() => {
            this.nowDrawer = "record";
            this.visibleDrawer = true;
          }}
        >
          传输历史
        </div>
        <div
          onClick={() => {
            this.nowDrawer = "vip";
            this.visibleDrawer = true;
          }}
          class="bar-wrapper__user__text bar-wrapper__user__text__update"
        >
          升级
        </div>
        <div class="bar-wrapper__user__text__login-out">
          <Popover
            overlayClassName="user-bar-popover"
            placement="bottomRight"
            arrowPointAtCenter={true}
            v-slots={{
              content: () => (
                <div class="gm-header-user__menus">
                  {/*<a*/}
                  {/*  class="gm-header-user__menu"*/}
                  {/*  href="https://www.gaoding.com/me/settings"*/}
                  {/*>*/}
                  {/*  <Icon*/}
                  {/*    type="iconUser-Outline"*/}
                  {/*    style={UserBarPopoverIconStyle}*/}
                  {/*  />*/}
                  {/*  账号设置*/}
                  {/*</a>*/}
                  {/*<a*/}
                  {/*  class="gm-header-user__menu"*/}
                  {/*  href="https://www.gaoding.com/me/messages"*/}
                  {/*>*/}
                  {/*  <Icon*/}
                  {/*    type="iconnotification"*/}
                  {/*    style={UserBarPopoverIconStyle}*/}
                  {/*  />*/}
                  {/*  消息中心*/}
                  {/*</a>*/}
                  <span
                    class="gm-header-user__menu"
                    onClick={async () => {
                      await oAuthClient.logout();
                      message.success("登出成功！");
                      await this.store.dispatch(QUERY_USER);
                    }}
                  >
                    <Icon
                      type="iconexit_outline"
                      style={UserBarPopoverIconStyle}
                    />
                    退出账号
                  </span>
                </div>
              ),
            }}
          >
            <div class="btn" onClick={() => null}>
              <Avatar size={24} src={this.user?.avatar} />
            </div>
          </Popover>
        </div>
        <Drawer
          destroyOnClose
          key="Drawer"
          drawerStyle={{
            padding: 0,
          }}
          wrapStyle={{
            padding: 0,
          }}
          bodyStyle={{
            padding: 0,
          }}
          zIndex={this.zIndex}
          width="1162"
          placement="right"
          closable={false}
          onClose={() => (this.visibleDrawer = false)}
          visible={this.visibleDrawer}
        >
          {this.nowDrawer === "vip" ? <Vip></Vip> : <Record></Record>}
        </Drawer>
      </div>
    );
  },
});
