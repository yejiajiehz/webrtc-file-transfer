import { Ref, watch } from "vue";

export function useStateChange<T>(
  state: Ref<T>,
  time: number,
  cb: (changed: boolean, newValue: T) => void
) {
  const timeid = setTimeout(() => {
    cb(false, state.value);
  }, time);

  watch(state, (v) => {
    clearTimeout(timeid);
    cb(true, v);
  });

  // onUpdated(() => {
  //   stop();
  // });
}
