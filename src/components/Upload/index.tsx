import { defineComponent, PropType } from "vue";

import { getChildren } from "@/utils/props";

export const Upload = defineComponent({
  name: "Upload",
  props: {
    directory: Boolean,
    onChange: Function as PropType<(fileList: File[]) => void>,
  },
  render() {
    const custompProps = this.directory
      ? { directory: true, webkitdirectory: true }
      : null;

    const children = getChildren(this.$slots);

    const onClick = () => {
      const el = this.$refs.fileInputRef as HTMLInputElement;
      if (!el) {
        return;
      }
      el.click();
    };

    return (
      <span onClick={onClick}>
        <input
          ref="fileInputRef"
          type="file"
          style={{ display: "none" }}
          // multiple
          onChange={(e) => {
            const { files } = e.target as HTMLInputElement;
            this.onChange?.(files ? [...files] : []);
            (this.$refs.fileInputRef as any).value = null;
          }}
          {...custompProps}
        />

        {children}
      </span>
    );
  },
});
