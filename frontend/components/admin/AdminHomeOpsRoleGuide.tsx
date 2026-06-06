"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import { CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";
import { CONSOLE_ROLES_70 } from "@/lib/admin/adminRole70Matrix";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_PRIMARY_ACTION_BTN_CLASS, ADMIN_SECONDARY_PILL_BTN_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** P6 · ① 运营角色能力说明（邮箱角色 vs 控制台角色 vs 审批权）。 */
export function AdminHomeOpsRoleGuide() {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const { lacksApprove } = useAdminApprovePermissionHint();

  if (!caps.permissionsLoaded || caps.capabilitiesUnavailable || !lacksApprove) {
    return null;
  }

  const consoleLabel = caps.consoleRole70
    ? t(CONSOLE_ROLE_70_LABEL_KEYS[caps.consoleRole70])
    : t("admin_home_ops_role_unknown");

  return (
    <AdminWarmL5Surface
      as="section"
      aria-label={t("admin_home_ops_role_guide_aria")}
      data-tt-admin-home-ops-role-guide="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_home_ops_role_guide_title")}</h2>
      <p className="mt-2 text-small text-ink-600">
        {t("admin_home_ops_role_guide_lead", { role: consoleLabel })}
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-small text-ink-600">
        <li>{t("admin_home_ops_role_guide_item_onboarding")}</li>
        <li>{t("admin_home_ops_role_guide_item_community")}</li>
        <li>{t("admin_home_ops_role_guide_item_approve")}</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/permissions"
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] px-4 text-small font-semibold ${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_ops_role_guide_cta_permissions")}
        </Link>
        <Link
          href="/admin/operator-guide"
          className={`${touchTargetLink44Classes} ${ADMIN_SECONDARY_PILL_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_home_ops_role_guide_cta_guide")}
        </Link>
        <button
          type="button"
          className={`${touchTargetLink44Classes} ${ADMIN_SECONDARY_PILL_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-home-ops-shell-preview="1"
          onClick={() => {
            const role = caps.consoleRole70 ?? "Ops";
            writeAdminShellPreviewRole(
              CONSOLE_ROLES_70.includes(role as (typeof CONSOLE_ROLES_70)[number])
                ? (role as (typeof CONSOLE_ROLES_70)[number])
                : "Ops",
            );
            window.location.href = "/admin";
          }}
        >
          {t("admin_home_ops_role_guide_cta_preview")}
        </button>
      </div>
    </AdminWarmL5Surface>
  );
}
