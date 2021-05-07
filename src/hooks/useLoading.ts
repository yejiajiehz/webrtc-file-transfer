import { ref } from "vue";

export function useLoading() {
  const loadingMap = ref<Record<string, boolean>>({});

  const setLoading = (key: string, v: boolean) => {
    loadingMap.value = {
      ...loadingMap.value,
      [key]: v,
    };
  };

  const getLoading = (key: string) => loadingMap.value[key] ?? false;

  return {
    setLoading,
    getLoading,
    loadingMap,
  };
}
