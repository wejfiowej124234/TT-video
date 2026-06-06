import type { MutableRefObject, Ref } from "react";

/** 合并多个 React ref（焦点陷阱 + 表单容器）。 */
export function publishDrawerMergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (el: T | null) => {
    refs.forEach((r) => {
      if (typeof r === "function") (r as (el: T | null) => void)(el);
      else if (r) (r as MutableRefObject<T | null>).current = el;
    });
  };
}
