"use client";

import { type ReactNode, useEffect } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";

type Props = {
  onClose: () => void;
  className?: string;
  children: ReactNode;
  /** 区分多实例 modal 的 data-tt-admin-dialog-focus-trap 值 */
  trapId?: string;
};

/** A11Y · ① Admin 对话框焦点陷阱（Esc 关闭 · Tab 循环）。 */
export function AdminDialogFocusPanel(props: Props) {
  const { onClose, className, children, trapId = "1" } = props;
  const focusTrapRef = useFocusTrap(true, onClose);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      ref={focusTrapRef}
      className={className}
      data-tt-admin-dialog-focus-trap={trapId}
    >
      {children}
    </div>
  );
}
