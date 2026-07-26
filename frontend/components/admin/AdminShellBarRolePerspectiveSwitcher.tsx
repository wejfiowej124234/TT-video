"use client";

import { useRouter } from "next/navigation";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import {
  CONSOLE_ROLES_70,
  CONSOLE_ROLE_70_LABEL_KEYS,
  type ConsoleRole70,
} from "@/lib/admin/adminRole70Matrix";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_SHELL_FORM_SELECT_CLASS } from "@/lib/adminUi";

/** IA-06 · 顶栏六角色 Shell 视角快切（session 预览 · 非 ② 真切换）。 */
export function AdminShellBarRolePerspectiveSwitcher() {
  const { t } = useTranslation();
  const router = useRouter();
  const selectId = useId();
  const { previewRole, dbRole } = useAdminEffectiveShellRole();
  const value = previewRole ?? "";

  const onChange = (next: string) => {
    if (next === "") {
      writeAdminShellPreviewRole(null);
    } else {
      writeAdminShellPreviewRole(next as ConsoleRole70);
    }
    router.refresh();
  };

  return (
    <label
      htmlFor={selectId}
      className="flex items-center gap-1.5"
      data-tt-admin-shell-role-perspective-switcher="1"
    >
      <span
        className="shrink-0 text-meta font-medium text-amber-800"
        data-tt-admin-shell-preview-label="1"
      >
        {t("admin_shell_role_perspective_switcher_visible")}
      </span>
      <span className="sr-only">{t("admin_shell_role_perspective_switcher_label")}</span>
      <select
        id={selectId}
        className={`${ADMIN_SHELL_FORM_SELECT_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
        data-tt-admin-shell-light-select="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-tt-admin-shell-role-perspective-select={previewRole ?? "db"}
        aria-description={t("admin_shell_role_perspective_switcher_title")}
        title={`${t("admin_shell_role_perspective_switcher_title")} ${t("admin_shell_role_perspective_refresh_hint")}`}
      >
        <option value="">
          {dbRole
            ? t("admin_shell_role_perspective_option_db", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole]),
              })
            : t("admin_shell_role_perspective_option_default")}
        </option>
        {CONSOLE_ROLES_70.filter((roleId) => roleId !== dbRole).map((roleId) => (
          <option key={roleId} value={roleId}>
            {t("admin_shell_role_perspective_option_preview", {
              role: t(CONSOLE_ROLE_70_LABEL_KEYS[roleId]),
            })}
          </option>
        ))}
      </select>
    </label>
  );
}
