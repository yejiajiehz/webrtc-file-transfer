import { message } from "ant-design-vue";

export function catchGlobalPromiseError() {
  window.addEventListener("unhandledrejection", (event) => {
    const errorMessage = (event.reason as Error)?.message;

    if (errorMessage) {
      message.error(errorMessage);
      event.preventDefault();
    }
  });
}
