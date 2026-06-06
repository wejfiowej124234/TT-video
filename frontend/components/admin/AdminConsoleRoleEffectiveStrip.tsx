"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import {
  CONSOLE_ROLE_70_LABEL_KEYS,
  type ConsoleRole70,
} from "@/lib/admin/adminRole70Matrix";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_CONSOLE_CALLOUT_PANEL_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_SHELL_SECONDARY_BTN_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

function sourceLabelKey(source: string | null): string {
  if (!source) return "admin_console_role_source_unknown";
  if (source.startsWith("env:")) return "admin_console_role_source_env";
  if (source.startsWith("db:")) return "admin_console_role_source_db";
  return "admin_console_role_source_mapped";
}

/** IA-06 · ① DB/API 生效角色 vs Shell 预览（② Staging 矩阵另验）。 */
export function AdminConsoleRoleEffectiveStrip() {
  const { t } = useTranslation();
  const router = useRouter();
  const caps = useAdminCapabilities();
  const { previewRole, dbRole, mode, consoleRoleSource } = useAdminEffectiveShellRole();
  const maintainer = isAdminMaintainerUi(caps.role);

  const effective = dbRole;
  if (!effective && !previewRole) return null;

  const applyDbToShell = () => {
    writeAdminShellPreviewRole(null);
    caps.reload();
    router.push("/admin");
  };

  const mirrorPreviewToDb = (role: ConsoleRole70) => {
    writeAdminShellPreviewRole(role);
    router.push("/admin");
  };

  return (
    <section
      id="admin-console-role-effective"
      className={`mt-6 ${ADMIN_CONSOLE_CALLOUT_PANEL_CLASS}`}
      aria-label={t("admin_console_role_effective_aria")}
      data-tt-admin-console-role-effective-strip="1"
    >
      <h2 className="text-body font-semibold text-ink-900">
        {maintainer
          ? t("admin_console_role_effective_title")
          : t("admin_console_role_effective_title_product")}
      </h2>
      <p className="mt-1 text-small text-ink-600">
        {maintainer ? t("admin_console_role_effective_lead") : t("admin_console_role_effective_lead_product")}
      </p>

      <dl className="mt-3 grid gap-2 text-small sm:grid-cols-2">
        <div>
          <dt className="font-medium text-ink-700">
            {maintainer
              ? t("admin_console_role_effective_api")
              : t("admin_console_role_effective_api_product")}
          </dt>
          <dd className="mt-0.5 text-ink-900" data-tt-admin-console-role-api="1">
            {effective ? t(CONSOLE_ROLE_70_LABEL_KEYS[effective]) : "—"}
            {maintainer ? (
              <span className="ml-2 font-mono text-meta text-ink-500">
                ({t(sourceLabelKey(consoleRoleSource))})
              </span>
            ) : (
              <span className="ml-2 text-meta text-ink-500">
                ({t("admin_console_role_source_product")})
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink-700">{t("admin_console_role_effective_shell")}</dt>
          <dd className="mt-0.5 text-ink-900" data-tt-admin-console-role-shell-mode={mode}>
            {previewRole
              ? t("admin_console_role_effective_shell_preview", {
                  role: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),
                })
              : effective
                ? t("admin_console_role_effective_shell_db", {
                    role: t(CONSOLE_ROLE_70_LABEL_KEYS[effective]),
                  })
                : "—"}
          </dd>
        </div>
      </dl>

      <AdminNoticeBanner
        tone="info"
        size="md"
        className="mt-3"
        message={t("admin_console_role_effective_honesty")}
        dataAttrs={{ "data-tt-admin-console-role-effective-honesty": "1" }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={ADMIN_PRIMARY_ACTION_BTN_CLASS}
          onClick={applyDbToShell}
          data-tt-admin-console-role-apply-db-shell="1"
        >
          {t("admin_console_role_apply_db_shell")}
        </button>
        {effective && previewRole && effective !== previewRole ? (
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
            onClick={() => mirrorPreviewToDb(effective)}
            data-tt-admin-console-role-align-preview-db="1"
          >
            {t("admin_console_role_align_preview_to_db")}
          </button>
        ) : null}
        <Link
          href="/admin/operator-guide#admin-operator-guide-role-prep"
          className={`${adminPageNavLinkClass()}`}
        >
          {t("admin_console_role_effective_guide")}
        </Link>
      </div>
    </section>
  );
}
