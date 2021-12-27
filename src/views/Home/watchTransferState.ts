import { Ref, watch } from "vue";
import { message } from "ant-design-vue";

import { TransferState } from "@/hooks/useSocket";
import { useStateChange } from "@/hooks/useStateChange";

// RTC 连接时间
const RTC_CONN_TIME = 5 * 1000;

// 确认的时间
const CONFIRM_TIME = 10 * 1000;

// 各种状态下的提示信息
const messageMap: Partial<
  Record<TransferState, string | { type: string; text: string }>
> = {
  received_response_reject: "对方拒绝接收文件！",
  received_cancel: "对方取消文件传输！",
  received_exit: "对方断开连接，文件传输失败！",
  received_completed: { type: "success", text: "文件传输成功！" },
};

// 在一段时间内无反馈，认为失败
const timeMap: Partial<
  Record<TransferState, { time: number; text?: string }>
> = {
  rtc_connecting: { time: RTC_CONN_TIME, text: "创建连接失败!请重试" },
  awaiting_response: { time: CONFIRM_TIME, text: "对方无响应!请重试" },
  // b 长时间未接收，失败
  received_file_info: { time: CONFIRM_TIME },
};

export function watchTransferState(
  transferState: Ref<TransferState>,
  clean: () => void
) {
  watch(transferState, (state) => {
    const info = messageMap[state];
    if (info) {
      if (typeof info === "string") {
        message.error(info);
      } else {
        message[info.type](info.text);
      }
      clean();
    }

    const timeInfo = timeMap[state];
    if (timeInfo) {
      useStateChange(transferState, timeInfo.time, (changed) => {
        if (!changed) {
          if (timeInfo.text) message.error(timeInfo.text);
          clean();
        }
      });
    }
  });
}
