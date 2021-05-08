import { ref, Ref, watch } from "vue";

function useSpeed(data: Ref<number>): Ref<number>;
function useSpeed(data: object, key: string): Ref<number>;
function useSpeed(data: Ref<number> | object, key?: string): Ref<number> {
  const speed = ref(0);

  const now = Date.now();
  watch(data, (current) => {
    const value: number = key ? data[key] : current;
    speed.value = value / ((Date.now() - now) / 1000);
  });

  return speed;
}

export { useSpeed };
