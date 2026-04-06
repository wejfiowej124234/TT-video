"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminApiErrorUserText,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  adminLogApiJsonStatus,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders, writeRequestHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type AdminUser = {
  id: string;
  email: string;
  role: string;
  kyc_status?: string;
  created_at?: string;
};

type AdminUsersRes = {
  status?: string;
  items?: AdminUser[];
  applied_filters?: Record<string, unknown>;
  meta?: unknown;
  error?: string;
};

type RoleChangeRes = {
  status?: string;
  error?: string;
  approval_request_id?: string;
};

const TARGET_ROLES = ["tourist", "guide", "arbitrator", "admin", "super_admin"] as const;
const ROLE_FILTER_MAX = 32;
const KYC_FILTER_MAX = 32;

function defaultTargetRole(current: string): string {
  const c = current.trim();
  const alt = TARGET_ROLES.find((r) => r !== c);
  return alt ?? TARGET_ROLES[0];
}

function roleChangeErrText(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "invalid_user_id":
      return t("admin_users_roleErrInvalidUser");
    case "unsupported_target_role":
      return t("admin_users_roleErrUnsupportedRole");
    case "target_user_not_found":
      return t("admin_users_roleErrTargetNotFound");
    case "role_unchanged":
      return t("admin_users_roleErrUnchanged");
    case "admin_role_change_request_failed":
      return t("admin_users_roleErrPersist");
    case "admin_db_required":
      return t("admin_users_roleErrDb");
    default:
      return adminApiErrorUserText(code, t);
  }
}

function clampUserLimit(n: number): number {
  if (!Number.isFinite(n)) return 100;
  return Math.min(500, Math.max(1, Math.floor(n)));
}

function parseUsersListQuery(sp: URLSearchParams): { limit: number; role: string; kyc_status: string } {
  const limit = clampUserLimit(Number.parseInt(sp.get("limit") ?? "100", 10));
  const role = (sp.get("role") ?? "").trim().slice(0, ROLE_FILTER_MAX);
  const kyc_status = (sp.get("kyc_status") ?? "").trim().slice(0, KYC_FILTER_MAX);
  return { limit, role, kyc_status };
}

function buildUsersListPath(q: { limit: number; role: string; kyc_status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(clampUserLimit(q.limit)));
  const r = q.role.trim().slice(0, ROLE_FILTER_MAX);
  if (r) sp.set("role", r);
  const k = q.kyc_status.trim().slice(0, KYC_FILTER_MAX);
  if (k) sp.set("kyc_status", k);
  return `/admin/users?${sp.toString()}`;
}

/** 70：用户列表 + Modal 发起 `POST …/users/:id/role-change-request`（须 admin + DB + chain_off）。 */
function AdminUsersPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const roleChangeDialogTitleId = useId();
  const roleChangeDialogDescId = useId();
  const roleChangeModalFilterHintId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, role, kyc_status } = useMemo(
    () => parseUsersListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminUser[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftRole, setDraftRole] = useState(role);
  const [draftKyc, setDraftKyc] = useState(kyc_status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftRole(role);
    setDraftKyc(kyc_status);
  }, [limit, role, kyc_status]);

  const [roleUser, setRoleUser] = useState<AdminUser | null>(null);
  const [targetRole, setTargetRole] = useState<string>(TARGET_ROLES[0]);
  const [roleReason, setRoleReason] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleModalError, setRoleModalError] = useState<string | null>(null);
  const [roleSuccessApprovalId, setRoleSuccessApprovalId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-users-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminUsersRes>(
      "AdminUsersPage",
      apiUrl(
        routes.admin.users({
          limit,
          ...(role ? { role } : {}),
          ...(kyc_status ? { kyc_status } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminUsersPage", e);
        setError(adminFetchErrorKind(e));
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [limit, role, kyc_status, reloadTick]);

  const bumpReload = () => setReloadTick((x) => x + 1);

  const applyFilters = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampUserLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(
      buildUsersListPath({
        limit: lim,
        role: draftRole.trim().slice(0, ROLE_FILTER_MAX),
        kyc_status: draftKyc.trim().slice(0, KYC_FILTER_MAX),
      }),
    );
  };

  const resetFilters = () => {
    router.push(buildUsersListPath({ limit: 100, role: "", kyc_status: "" }));
  };

  const openRoleModal = (u: AdminUser) => {
    setRoleModalError(null);
    setRoleUser(u);
    setTargetRole(defaultTargetRole(u.role ?? ""));
    setRoleReason("");
  };

  const closeRoleModal = () => {
    setRoleUser(null);
    setRoleModalError(null);
    setRoleSubmitting(false);
  };

  const submitRoleChange = () => {
    const uid = roleUser?.id?.trim();
    if (!uid) return;
    setRoleSubmitting(true);
    setRoleModalError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setRoleModalError(t("admin_users_roleAuth"));
      setRoleSubmitting(false);
      return;
    }

    const body: { target_role: string; reason: string | null } = {
      target_role: targetRole.trim(),
      reason: roleReason.trim() === "" ? null : roleReason.trim(),
    };

    void adminFetchJson<RoleChangeRes>(
      "AdminUsersRoleChange",
      apiUrl(routes.admin.userRoleChangeRequest(uid)),
      { method: "POST", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        if (res.status === 501 && b?.status === "not_implemented") {
          setRoleModalError(t("admin_users_roleErrNotImplemented"));
          return;
        }
        if (!res.ok) {
          const code = typeof b?.error === "string" ? b.error : undefined;
          setRoleModalError(roleChangeErrText(code, t));
          return;
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminUsersRoleChange", b);
          setRoleModalError(roleChangeErrText(typeof b.error === "string" ? b.error : undefined, t));
          return;
        }
        const aid = b.approval_request_id?.trim();
        if (aid) setRoleSuccessApprovalId(aid);
        closeRoleModal();
        bumpReload();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminUsersRoleChange", e);
        const msg = e instanceof Error ? e.message : "";
        setRoleModalError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setRoleSubmitting(false));
  };

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_users_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_users_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link href="/admin/approvals" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_users_linkApprovals")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      {roleSuccessApprovalId ? (
        <div
          className="mt-6 rounded-[var(--radius-md)] border border-success/25 bg-success/10 p-3 text-body text-success"
          role="status"
        >
          <p>
            {t("admin_users_roleSuccessPrefix")}{" "}
            <span className="font-mono text-meta">{roleSuccessApprovalId}</span>
            {t("admin_users_roleSuccessSuffix")}
          </p>
          <Link href="/admin/approvals" className={`mt-2 ${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_users_linkApprovals")}
          </Link>
          <form
            className="ml-4 inline"
            onSubmit={(e) => {
              e.preventDefault();
              setRoleSuccessApprovalId(null);
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] px-3 text-small text-ink-700 hover:bg-success/15 hover:underline ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_users_roleDismissSuccess")}
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-users-filter-form"
          aria-label={t("admin_users_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={applyFilters}
        >
          <h2 className="text-body font-medium text-ink-800">{t("admin_users_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-small text-ink-700">
              {t("admin_users_limit_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_users_role_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftRole}
                onChange={(e) => setDraftRole(e.target.value)}
                placeholder={t("admin_users_role_filter_ph")}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_users_kyc_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftKyc}
                onChange={(e) => setDraftKyc(e.target.value)}
                placeholder={t("admin_users_kyc_filter_ph")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-users-filter-form"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-3 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            type="submit"
          >
            {t("admin_users_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              resetFilters();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              type="submit"
            >
              {t("admin_users_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_users_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_users_applied")} {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_users_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin_users_colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_users_colRole")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_users_colKyc")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_users_colCreated")}</th>
                <th className="px-4 py-3 font-medium">{t("admin_users_colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-ink-500" colSpan={5}>
                    {t("admin_users_empty")}
                  </td>
                </tr>
              )}
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">{u.kyc_status ?? t("admin_em_dash")}</td>
                  <td className="px-4 py-3">
                    {u.created_at ? new Date(u.created_at).toLocaleString() : t("admin_em_dash")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <Link
                        href={`/admin/users/${encodeURIComponent(u.id)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline font-medium whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_ops_userDetailAdmin")}
                      </Link>
                      <form
                        className="inline"
                        onSubmit={(e) => {
                          e.preventDefault();
                          openRoleModal(u);
                        }}
                      >
                        <button
                          type="submit"
                          className={`${touchTargetLink44Classes} !justify-start text-travel-500 hover:underline text-left whitespace-nowrap ${travelFocusRingOffset2Classes}`}
                        >
                          {t("admin_users_roleRequest")}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {roleUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={roleChangeDialogTitleId}
          aria-describedby={roleChangeDialogDescId}
        >
          <div className="max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
            <h2 id={roleChangeDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_users_roleModalTitle")}
            </h2>
            <p id={roleChangeDialogDescId} className="mt-1 text-small text-ink-600">
              {t("admin_users_roleModalSubtitle")}
            </p>
            <p className="mt-2 font-mono text-meta text-ink-800 break-all">{roleUser.email}</p>
            <p className="mt-1 text-small text-ink-500">
              {t("admin_users_roleCurrent")}: <span className="font-medium text-ink-800">{roleUser.role}</span>
            </p>
            <p id={roleChangeModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
              {t("admin_users_role_modal_filter_hint")}
            </p>

            <form
              aria-describedby={roleChangeModalFilterHintId}
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closeRoleModal();
                  return;
                }
                submitRoleChange();
              }}
            >
            <label className="mt-4 block text-small text-ink-800">
              {t("admin_users_roleTarget")}
              <select
                name="target_role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {TARGET_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-small text-ink-800">
              {t("admin_users_roleReason")}
              <textarea
                name="reason"
                value={roleReason}
                onChange={(e) => setRoleReason(e.target.value)}
                placeholder={t("admin_users_roleReasonPh")}
                rows={3}
                className={`mt-1 w-full min-h-[80px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </label>

            {roleModalError ? (
              <p className="mt-3 text-small text-danger" role="alert">
                {roleModalError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-800 hover:bg-bg-console ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_users_roleCancel")}
              </button>
              <button
                type="submit"
                disabled={roleSubmitting}
                aria-busy={roleSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {roleSubmitting ? t("admin_users_roleSubmitting") : t("admin_users_roleSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_users_title">
      <AdminUsersPageInner />
    </AdminSearchParamsSuspense>
  );
}

