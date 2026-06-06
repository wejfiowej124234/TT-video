"use client";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import {
  ADM_U01_SHELL_GROUP_IDS,
  ADM_U01_SHELL_GROUP_LABEL_KEYS,
  admU01ShellGroupVisible,
} from "@/lib/admin/admU01ShellGroupVisibility";
import {
  orderConsoleRoles70WithCurrentFirst,
} from "@/lib/admin/adminConsoleRole70PickOrder";
import {
  CONSOLE_ROLE_70_LABEL_KEYS,
  type ConsoleRole70,
} from "@/lib/admin/adminRole70Matrix";
import {
  readAdminShellPreviewRole,
  writeAdminShellPreviewRole,
} from "@/lib/admin/adminShellPreviewRole";
import {
  ADMIN_FOCUS_RING_CORE_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_SHELL_PREVIEW_ACTIVE_ROLE_CLASS,
  ADMIN_SHELL_PREVIEW_CURRENT_ROLE_CLASS,
  ADMIN_SHELL_PREVIEW_IDLE_ROLE_CLASS,
  ADMIN_SHELL_PREVIEW_GROUP_HIDDEN_CLASS,
  ADMIN_SHELL_PREVIEW_GROUP_VISIBLE_CLASS,
  ADMIN_SHELL_SECONDARY_BTN_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,} from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { adminPageNavLinkClass } from "@/lib/adminUi";

type Props = {
  currentRole: ConsoleRole70 | null;
};

/** IA-06 · ① 本地 Shell 视角预览（非 ② 真切换 · 不修改 capabilities）。 */
export function AdminConsoleRoleShellPreview({ currentRole }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const selectId = useId();
  const [previewRole, setPreviewRole] = useState<ConsoleRole70>(
    () => readAdminShellPreviewRole() ?? currentRole ?? "SuperAdmin",
  );
  const [appliedRole, setAppliedRole] = useState<ConsoleRole70 | null>(() =>
    readAdminShellPreviewRole(),
  );

  const hiddenGroups = useMemo(
    () =>
      ADM_U01_SHELL_GROUP_IDS.filter((groupId) => !admU01ShellGroupVisible(groupId, previewRole)),
    [previewRole],
  );

  const rolePickOrder = useMemo(
    () => orderConsoleRoles70WithCurrentFirst(currentRole),
    [currentRole],
  );

  return (
    <AdminWarmL5Surface
      as="section"
      id="admin-shell-preview"
      className="mt-10 scroll-mt-24"
      aria-label={t("admin_permissions_shell_preview_aria")}
      data-tt-admin-console-role-shell-preview="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_permissions_shell_preview_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_permissions_shell_preview_hint")}</p>

      <AdminNoticeBanner
        tone="info"
        size="md"
        className="mt-3"
        message={t("admin_permissions_shell_preview_honesty")}
        dataAttrs={{ "data-tt-admin-shell-preview-honesty": "1" }}
      />

      <label htmlFor={selectId} className="mt-4 block text-small font-medium text-ink-800">
        {t("admin_permissions_shell_preview_select")}
        <select
          id={selectId}
          className={`mt-1 block w-full max-w-xs ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          value={previewRole}
          onChange={(e) => setPreviewRole(e.target.value as ConsoleRole70)}
          data-tt-admin-shell-preview-role={previewRole}
        >
          {rolePickOrder.map((roleId) => (
            <option key={roleId} value={roleId}>
              {t(CONSOLE_ROLE_70_LABEL_KEYS[roleId])}
              {currentRole === roleId ? ` (${t("admin_permissions_current_role")})` : ""}
            </option>
          ))}
        </select>
      </label>

      <div
        className="mt-3 flex flex-wrap gap-2"
        data-tt-admin-shell-preview-quick-roles="1"
        aria-label={t("admin_permissions_shell_preview_quick_aria")}
      >
        {rolePickOrder.map((roleId) => {
          const isCurrent = currentRole === roleId;
          return (
          <button
            key={roleId}
            type="button"
            className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border px-3 py-1 text-small font-medium ${
              previewRole === roleId
                ? ADMIN_SHELL_PREVIEW_ACTIVE_ROLE_CLASS
                : isCurrent
                  ? ADMIN_SHELL_PREVIEW_CURRENT_ROLE_CLASS
                  : ADMIN_SHELL_PREVIEW_IDLE_ROLE_CLASS
            } ${ADMIN_FOCUS_RING_CORE_CLASS}`}
            onClick={() => setPreviewRole(roleId)}
            data-tt-admin-shell-preview-quick-role={roleId}
            data-tt-admin-shell-preview-quick-role-current={isCurrent ? "1" : undefined}
            aria-current={isCurrent ? "true" : undefined}
          >
            {t(CONSOLE_ROLE_70_LABEL_KEYS[roleId])}
            {isCurrent ? (
              <span className="ml-1 font-normal text-ink-600">({t("admin_permissions_current_role")})</span>
            ) : null}
          </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" data-tt-admin-shell-preview-actions="1">
        <button
          type="button"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          onClick={() => {
            writeAdminShellPreviewRole(previewRole);
            setAppliedRole(previewRole);
            router.push("/admin");
          }}
          data-tt-admin-shell-preview-apply="1"
        >
          {t("admin_permissions_shell_preview_apply")}
        </button>
        {appliedRole ? (
          <button
            type="button"
            className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS}`}
            onClick={() => {
              writeAdminShellPreviewRole(null);
              setAppliedRole(null);
            }}
            data-tt-admin-shell-preview-clear="1"
          >
            {t("admin_permissions_shell_preview_clear")}
          </button>
        ) : null}
        <Link
          href="/admin"
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center ${adminPageNavLinkClass()}`}
        >
          {t("admin_permissions_shell_preview_back_workspace")}
        </Link>
        <Link
          href="#admin-console-role-self-assign"
          className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center ${adminPageNavLinkClass()}`}
          data-tt-admin-shell-preview-self-role-link="1"
        >
          {t("admin_permissions_shell_preview_self_role_link")}
        </Link>
      </div>
      {appliedRole ? (
        <p className="mt-2 text-small text-ink-600" data-tt-admin-shell-preview-applied="1" role="status">
          {t("admin_permissions_shell_preview_applied", {
            role: t(CONSOLE_ROLE_70_LABEL_KEYS[appliedRole]),
          })}
        </p>
      ) : null}

      <ul className="mt-4 grid gap-2 sm:grid-cols-2" data-tt-admin-shell-preview-groups="1">
        {ADM_U01_SHELL_GROUP_IDS.map((groupId) => {
          const visible = admU01ShellGroupVisible(groupId, previewRole);
          return (
            <li
              key={groupId}
              className={`rounded-[var(--radius-md)] border px-3 py-2 text-small ${
                visible ? ADMIN_SHELL_PREVIEW_GROUP_VISIBLE_CLASS : ADMIN_SHELL_PREVIEW_GROUP_HIDDEN_CLASS
              }`}
              data-tt-admin-shell-preview-group={groupId}
              data-tt-admin-shell-preview-visible={visible ? "1" : "0"}
            >
              <span className="font-medium">{t(ADM_U01_SHELL_GROUP_LABEL_KEYS[groupId])}</span>
              <span className="ml-2 text-meta">
                {visible ? t("admin_permissions_shell_preview_visible") : t("admin_permissions_shell_preview_hidden")}
              </span>
            </li>
          );
        })}
      </ul>

      {hiddenGroups.length > 0 ? (
        <p className="mt-3 text-small text-ink-600">
          {t("admin_permissions_shell_preview_hidden_summary", { count: hiddenGroups.length })}
        </p>
      ) : (
        <p className="mt-3 text-small text-ink-600">{t("admin_permissions_shell_preview_all_visible")}</p>
      )}
    </AdminWarmL5Surface>
  );
}
