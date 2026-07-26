"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import {
  ADMIN_SHELL_PREVIEW_NOTICE_CLASS,
  ADMIN_BTN_GHOST_DARK_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * Batch-10 HU-296 · 全局预览隔离条（全 /admin 路由可见）。
 * 首页细节展开仍可由 `AdminHomeShellPreviewBanner` 承担；本条 = 写隔离硬提示 SSOT。
 */
export function AdminShellPreviewNotice() {
  const { t } = useTranslation();
  const { previewRole } = useAdminEffectiveShellRole();

  if (!previewRole) return null;

  return (
    <div
      className={`${ADMIN_SHELL_PREVIEW_NOTICE_CLASS} flex flex-wrap items-center justify-between gap-2 px-3 py-2`}
      data-tt-admin-shell-preview-notice="1"
      data-tt-admin-shell-preview-isolation="1"
      role="status"
    >
      <p className="text-small font-medium text-[#0c0a09]">
        {t("admin_shell_preview_isolation_banner", {
          role: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),
        })}
      </p>
      <button
        type="button"
        className={`${touchTargetLink44Classes} ${ADMIN_BTN_GHOST_DARK_CLASS} ${travelFocusRingOffset2Classes} px-3 py-1 text-small`}
        data-tt-admin-shell-preview-exit="1"
        onClick={() => writeAdminShellPreviewRole(null)}
      >
        {t("admin_shell_preview_exit_cta")}
      </button>
    </div>
  );
}
