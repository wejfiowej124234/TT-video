"use client";

import { usePathname } from "next/navigation";

import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { useAdminHomeInboxFocusMode } from "@/lib/admin/useAdminHomeInboxFocusMode";
import { ADMIN_SHELL_PREVIEW_NOTICE_CLASS } from "@/lib/adminUi";

/** Warm preview notice token · runtime SSOT = `AdminActorCapabilityStrip` / `AdminHomeShellPreviewBanner`. */
void ADMIN_SHELL_PREVIEW_NOTICE_CLASS;

/**
 * IA-06 · Shell 预览顶栏（batch55 · 与子页 capability strip / 首页 banner 去重）。
 * 预览态仅保留聚焦 defer 的 sr-only 锚点；可见 chrome 由 capability strip（子页）或 home banner（工作台）承担。
 */
export function AdminShellPreviewNotice() {
  const pathname = usePathname() ?? "";
  const { previewRole } = useAdminEffectiveShellRole();
  const homeInboxFocus = useAdminHomeInboxFocusMode();

  if (!previewRole) return null;
  if (!homeInboxFocus || pathname !== "/admin") return null;

  return (
    <div
      className="sr-only"
      data-tt-admin-shell-preview-notice="1"
      data-tt-admin-shell-preview-notice-deferred="1"
      aria-hidden
    />
  );
}
