"use client";

import { adminModalScrimClass } from "@/components/market/marketStudioModalLayout";

type Props = {
  onClose: () => void;
};

/** A11Y · ① Admin 对话框遮罩（点击关闭 · 非模态外区域穿透）。 */
export function AdminDialogScrim(props: Props) {
  return (
    <div
      className={adminModalScrimClass}
      aria-hidden
      onClick={props.onClose}
      data-tt-admin-dialog-scrim="1"
    />
  );
}
