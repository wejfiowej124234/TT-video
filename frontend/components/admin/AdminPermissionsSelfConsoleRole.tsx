"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import {
  CONSOLE_ROLE_70_LABEL_KEYS,
  CONSOLE_ROLES_70,
  type ConsoleRole70,
} from "@/lib/admin/adminRole70Matrix";
import { writeAdminShellPreviewRole } from "@/lib/admin/adminShellPreviewRole";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { getMe } from "@/lib/apiClient";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type Props = {
  canAssign: boolean;
  dbPrep: boolean;
  approvalWired: boolean;
  consoleRoleDirectAllowed: boolean;
  currentConsoleRole: ConsoleRole70 | null;
  busy: boolean;
  message: string | null;
  onAssignSelf: (role: ConsoleRole70, reason: string) => Promise<void>;
};

function meUserIdFromGetMe(me: unknown): string {
  if (!me || typeof me !== "object") return "";
  const id = (me as { user?: { id?: string } }).user?.id;
  return typeof id === "string" ? id.trim() : "";
}

/** IA-06 · ① 本地：为当前登录管理员写入 `admin_console_roles`（须 DB + 直写或审批链）。 */
export function AdminPermissionsSelfConsoleRole(props: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const caps = useAdminCapabilities();
  const maintainer = isAdminMaintainerUi(caps.role);
  const {
    canAssign,
    dbPrep,
    approvalWired,
    consoleRoleDirectAllowed,
    currentConsoleRole,
    busy,
    message,
    onAssignSelf,
  } = props;
  const [myUserId, setMyUserId] = useState("");
  const [pickRole, setPickRole] = useState<ConsoleRole70>("Ops");
  const [reason, setReason] = useState("");

  useEffect(() => {
    void getMe().then((me) => {
      const id = meUserIdFromGetMe(me);
      if (id) setMyUserId(id);
    });
  }, []);

  if (!dbPrep || !canAssign || (!consoleRoleDirectAllowed && !approvalWired)) return null;

  return (
    <section
      id="admin-console-role-self-assign"
      className="mt-6 rounded-[var(--radius-lg)] border border-ink-200 bg-white p-4 scroll-mt-24"
      aria-label={t("admin_permissions_self_role_aria")}
      data-tt-admin-console-role-self-assign="1"
    >
      <h2 className="text-body font-semibold text-ink-900">{t("admin_permissions_self_role_title")}</h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_permissions_self_role_hint")}</p>
      {currentConsoleRole ? (
        <p className="mt-2 text-small text-ink-700" data-tt-admin-console-role-effective="1">
          {t("admin_permissions_self_role_current", {
            role: t(CONSOLE_ROLE_70_LABEL_KEYS[currentConsoleRole]),
          })}
        </p>
      ) : null}
      <AdminNoticeBanner
        tone="info"
        size="md"
        className="mt-3"
        message={
          approvalWired
            ? t("admin_permissions_self_role_approval_note")
            : t("admin_permissions_self_role_direct_note")
        }
        dataAttrs={{ "data-tt-admin-self-role-honesty": "1" }}
      />
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label={t("admin_permissions_self_role_preset_aria")}
        data-tt-admin-self-role-presets="1"
      >
        {CONSOLE_ROLES_70.map((r) => (
          <button
            key={r}
            type="button"
            className={`rounded-full border px-3 py-1 text-small ${
              pickRole === r
                ? "border-ink-800 bg-ink-900 text-white"
                : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50"
            }`}
            onClick={() => setPickRole(r)}
          >
            {t(CONSOLE_ROLE_70_LABEL_KEYS[r])}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block text-small">
          <span className="font-medium text-ink-800">{t("admin_permissions_self_role_pick")}</span>
          <select
            className={`mt-1 block rounded border border-ink-200 px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={pickRole}
            onChange={(e) => setPickRole(e.target.value as ConsoleRole70)}
          >
            {CONSOLE_ROLES_70.map((r) => (
              <option key={r} value={r}>
                {t(CONSOLE_ROLE_70_LABEL_KEYS[r])}
              </option>
            ))}
          </select>
        </label>
        <label className="block flex-1 min-w-[200px] text-small">
          <span className="font-medium text-ink-800">{t("admin_permissions_assign_reason")}</span>
          <input
            className={`mt-1 block w-full rounded border border-ink-200 px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={busy || !myUserId}
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} disabled:opacity-50`}
          onClick={() => {
            writeAdminShellPreviewRole(null);
            void onAssignSelf(pickRole, reason);
          }}
          data-tt-admin-self-role-submit="1"
        >
          {busy ? t("admin_permissions_assign_busy") : t("admin_permissions_self_role_submit")}
        </button>
        <button
          type="button"
          className={adminPageNavLinkClass()}
          data-tt-admin-self-role-preview-shell="1"
          onClick={() => {
            writeAdminShellPreviewRole(pickRole);
            router.push("/admin");
          }}
        >
          {t("admin_permissions_self_role_preview_shell")}
        </button>
      </div>
      {maintainer && myUserId ? (
        <p className="mt-2 font-mono text-meta text-ink-500" data-tt-admin-self-user-id="1">
          {t("admin_permissions_self_role_user_id", { id: myUserId })}
        </p>
      ) : !myUserId ? (
        <p className="mt-2 text-meta text-ink-500">{t("admin_permissions_self_role_no_session")}</p>
      ) : null}
      {message ? <p className="mt-3 text-small text-ink-700">{message}</p> : null}
    </section>
  );
}
