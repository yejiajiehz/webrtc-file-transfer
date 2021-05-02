import { Slots, SetupContext } from "vue";
import classnames from "classnames";

export const getChildren = (slots: Slots) => {
  return slots.default?.();
};

export const getClasses = (className: string, { attrs }: SetupContext) => {
  return classnames(className, {
    [attrs.class as string]: attrs.class,
  });
};
