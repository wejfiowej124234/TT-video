"use client";

import { ADMIN_MODAL_SCRIM_CLASS } from "@/lib/adminUi";

type Props = {
  onClose: () => void;
};

/** A11Y · ① Admin 对话框遮罩（点击关闭 · 非模态外区域穿透）。 */
export function AdminDialogScrim(props: Props) {
  return (
    <div
      className={ADMIN_MODAL_SCRIM_CLASS}
      aria-hidden
      onClick={props.onClose}
      data-tt-admin-dialog-scrim="1"
    />
  );
}
