"use client";



import Link from "next/link";



import { useTranslation } from "@/components/LocaleProvider";

import {

  CONSOLE_ROLE_70_LABEL_KEYS,

} from "@/lib/admin/adminRole70Matrix";

import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";

import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";

import { ADMIN_SHELL_PREVIEW_BANNER_CLASS, ADMIN_SHELL_BTN_GHOST_DARK_CLASS, ADMIN_TEXT_BODY_CLASS, ADMIN_TEXT_META_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";



/** IA-06 · ① 首页提示：当前为 Shell 预览视角（session · 非 capabilities 真切换）。 */

export function AdminHomeShellPreviewBanner() {

  const { t } = useTranslation();

  const { previewRole, dbRole, permissionsLoaded } = useAdminEffectiveShellRole();



  if (!previewRole || !permissionsLoaded) return null;

  const previewLabel = t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]);
  const effectiveLabel = dbRole
    ? t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole])
    : t("admin_home_ops_role_unknown");

  return (
    <details
      className={ADMIN_SHELL_PREVIEW_BANNER_CLASS}
      data-tt-admin-home-shell-preview-banner="1"
      data-tt-admin-home-shell-preview-banner-collapsible="1"
    >
      <summary
        className={`cursor-pointer list-none text-small font-medium ${ADMIN_TEXT_BODY_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}
        aria-label={t("admin_home_shell_preview_banner_aria")}
      >
        {t("admin_home_shell_preview_banner_summary", {
          preview: previewLabel,
          effective: effectiveLabel,
        })}
      </summary>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`min-w-0 text-small ${ADMIN_TEXT_BODY_CLASS}`}>
          {t("admin_home_shell_preview_banner_lead", {
            preview: previewLabel,
            effective: effectiveLabel,
          })}
        </p>
        <p className={`text-meta ${ADMIN_TEXT_META_CLASS}`} data-tt-admin-home-shell-preview-readonly="1">
          {t("admin_home_shell_preview_banner_readonly_note")}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_SHELL_BTN_GHOST_DARK_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-home-shell-preview-clear="1"
            onClick={() => {
              writeAdminShellPreviewRole(null);
              window.location.reload();
            }}
          >
            {t("admin_home_shell_preview_banner_clear")}
          </button>
          <Link
            href="/admin/permissions#admin-shell-preview"
            className={`${touchTargetLink44Classes} text-small font-medium ${adminPageNavLinkClass()} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_home_shell_preview_banner_permissions")}
          </Link>
        </div>
      </div>
    </details>
  );

}


