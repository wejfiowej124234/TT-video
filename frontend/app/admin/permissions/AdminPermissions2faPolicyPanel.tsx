"use client";

import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { useCallback, useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { useAdminL5ConfirmRequest } from "@/components/admin/AdminL5ConfirmProvider";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import {
  ADMIN_2FA_POLICY_ACTIVE_BADGE_CLASS,
  ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_STEP_MARKER_CLASS,
} from "@/lib/adminUi";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { CONSOLE_ROLES_70, CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { adminFetchJson, adminErrorUserText, adminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";

type PolicyBody = {
  policy?: { enforced?: boolean; required_console_roles?: string[] };
  error?: string;
};

export function AdminPermissions2faPolicyPanel() {
  const { t } = useTranslation();
  const sectionId = useId();
  const caps = useAdminCapabilities();
  const requestConfirm = useAdminL5ConfirmRequest();
  const { canWrite } = useAdminCanWrite(ADMIN_PERM.APPROVE);
  const [enforced, setEnforced] = useState(false);
  const [requiredRoles, setRequiredRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setMsg(null);
    void adminFetchJson<PolicyBody>("Admin2faPolicy", apiUrl(routes.admin.security2faPolicy), {
      headers: { "x-request-id": `admin-2fa-policy-${Date.now()}`, ...getAuthHeaders() },
    })
      .then(({ res, body }) => {
        if (!res.ok) {
          setMsg(t("admin_permissions_2fa_policy_load_error"));
          return;
        }
        setEnforced(body.policy?.enforced === true);
        const roles = body.policy?.required_console_roles?.filter(Boolean) ?? [];
        setRequiredRoles(roles.length > 0 ? roles : ["SuperAdmin", "Ops"]);
      })
      .catch((e) => setMsg(adminErrorUserText(adminFetchErrorKind(e), t)))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSaveImpl(patch: { enforced?: boolean; required_console_roles?: string[] }) {
    if (!canWrite) return;
    setBusy(true);
    setMsg(null);
    try {
      const { res, body } = await adminFetchJson<PolicyBody>(
        "Admin2faPolicyPatch",
        apiUrl(routes.admin.security2faPolicy),
        {
          method: "PATCH",
          headers: {
            ...writeRequestHeaders(`admin-2fa-policy-patch-${Date.now()}`),
            "x-request-id": `admin-2fa-policy-patch-${Date.now()}`,
          },
          body: JSON.stringify(patch),
        },
      );
      if (!res.ok) {
        setMsg(adminErrorUserText(adminFetchErrorKind(new Error(body.error ?? "failed")), t));
        return;
      }
      setEnforced(body.policy?.enforced === true);
      const roles = body.policy?.required_console_roles?.filter(Boolean) ?? requiredRoles;
      setRequiredRoles(roles);
      setMsg(t("admin_permissions_2fa_policy_saved"));
      caps.reload();
      window.dispatchEvent(new CustomEvent("traveltrust:admin-2fa-change"));
    } catch (e) {
      setMsg(adminErrorUserText(adminFetchErrorKind(e), t));
    } finally {
      setBusy(false);
    }
  }

  const onSaveEnforced = (next: boolean) => {
    if (!canWrite || next === enforced) return;
    requestConfirm({
      titleKey: next ? "admin_l5_confirm_title_danger" : "admin_l5_confirm_title_write",
      descKey: next ? "admin_l5_confirm_desc_2fa_policy_enforce" : "admin_l5_confirm_desc_2fa_policy_relax",
      danger: next,
      onConfirm: () => void onSaveImpl({ enforced: next }),
    });
  };

  const toggleRole = (role: string) => {
    setRequiredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role].sort(),
    );
  };

  const saveRoles = () => {
    if (!canWrite || requiredRoles.length === 0) return;
    requestConfirm({
      titleKey: "admin_l5_confirm_title_write",
      descKey: "admin_permissions_2fa_policy_roles_confirm",
      onConfirm: () => void onSaveImpl({ required_console_roles: requiredRoles }),
    });
  };

  if (!caps.phase2Prep?.totp_verification_wired) return null;

  return (
    <AdminWarmL5Surface
      as="section"
      id={sectionId}
      className="mt-6"
      data-tt-admin-2fa-policy-panel="1"
      aria-labelledby={`${sectionId}-title`}
    >
      <h2 id={`${sectionId}-title`} className="text-body font-semibold text-ink-900">
        {t("admin_permissions_2fa_policy_title")}
      </h2>
      <p className="mt-1 text-small text-ink-600">{t("admin_permissions_2fa_policy_hint")}</p>
      <ol className={`mt-4 space-y-2 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`} aria-label={t("admin_permissions_2fa_steps_aria")}>
        {(["admin_permissions_2fa_step1", "admin_permissions_2fa_step2", "admin_permissions_2fa_step3"] as const).map(
          (key, i) => (
            <li key={key} className="flex gap-2 text-small text-ink-700">
              <span className={ADMIN_STEP_MARKER_CLASS} aria-hidden>
                {i + 1}.
              </span>
              <span>{t(key)}</span>
            </li>
          ),
        )}
      </ol>
      {loading ? (
        <AdminListLoadingStatus message={t("admin_capability_strip_loading")} className="mt-3 text-small text-ink-500" />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-small">
              <input
                type="checkbox"
                checked={enforced}
                disabled={!canWrite || busy}
                onChange={(e) => void onSaveEnforced(e.target.checked)}
                data-tt-admin-2fa-policy-enforced="1"
              />
              <span>{t("admin_permissions_2fa_policy_enforced")}</span>
            </label>
            {caps.phase2Prep?.enforce_2fa ? (
              <span className={ADMIN_2FA_POLICY_ACTIVE_BADGE_CLASS}>
                {t("admin_permissions_2fa_policy_active")}
              </span>
            ) : (
              <span className={ADMIN_FIN_SUITE_STATUS_PLACEHOLDER_CLASS} data-tt-admin-2fa-staging-prep="1">
                {t("admin_permissions_2fa_staging_prep")}
              </span>
            )}
          </div>
          <div className="mt-4" data-tt-admin-2fa-policy-roles="1">
            <p className="text-small font-medium text-ink-800">{t("admin_permissions_2fa_policy_roles_title")}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {CONSOLE_ROLES_70.map((role) => (
                <label key={role} className="flex items-center gap-2 text-small">
                  <input
                    type="checkbox"
                    checked={requiredRoles.includes(role)}
                    disabled={!canWrite || busy}
                    onChange={() => toggleRole(role)}
                  />
                  <span>{t(CONSOLE_ROLE_70_LABEL_KEYS[role])}</span>
                </label>
              ))}
            </div>
            {canWrite ? (
              <button
                type="button"
                className={`mt-3 ${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
                disabled={busy || requiredRoles.length === 0}
                onClick={saveRoles}
              >
                {t("admin_permissions_2fa_policy_roles_save")}
              </button>
            ) : null}
          </div>
        </>
      )}
      {msg ? <p className="mt-3 text-small text-ink-700">{msg}</p> : null}
      {!canWrite ? (
        <p className="mt-2 text-meta text-ink-500">{t("admin_permissions_2fa_policy_readonly")}</p>
      ) : null}
    </AdminWarmL5Surface>
  );
}
