"use client";



import Link from "next/link";



import { useTranslation } from "@/components/LocaleProvider";

import {

  CONSOLE_ROLE_70_LABEL_KEYS,

} from "@/lib/admin/adminRole70Matrix";

import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";

import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";

import { adminPageNavLinkClass } from "@/lib/adminUi";

import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";



/** IA-06 · ① 首页提示：当前为 Shell 预览视角（session · 非 capabilities 真切换）。 */

export function AdminHomeShellPreviewBanner() {

  const { t } = useTranslation();

  const { previewRole, dbRole } = useAdminEffectiveShellRole();



  if (!previewRole) return null;



  return (

    <section

      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-sky-200 bg-sky-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"

      aria-label={t("admin_home_shell_preview_banner_aria")}

      data-tt-admin-home-shell-preview-banner="1"

    >

      <p className="min-w-0 text-small text-ink-800">

        {t("admin_home_shell_preview_banner_lead", {

          preview: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),

          effective: dbRole ? t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole]) : t("admin_home_ops_role_unknown"),

        })}

      </p>

      <p className="text-meta text-ink-700" data-tt-admin-home-shell-preview-readonly="1">

        {t("admin_home_shell_preview_banner_readonly_note")}

      </p>

      <div className="flex shrink-0 flex-wrap gap-2">

        <button

          type="button"

          className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingOffset2Classes}`}

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

    </section>

  );

}


