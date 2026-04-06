"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
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

type PolicyItem = {
  id?: string;
  policy?: { code?: string; version?: number; status?: string };
  scope?: { type?: string; expr?: string | null };
  binding?: { role?: string; resources?: unknown };
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: PolicyItem[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type PublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
  meta?: Record<string, unknown>;
};

const PUBLISH_STATUSES = ["draft", "active", "deprecated"] as const;
const POLICY_CODE_MAX = 256;
const SCOPE_TYPE_MAX = 64;
const BINDING_ROLE_MAX = 128;
const POLICY_STATUS_URL = new Set(["draft", "active", "deprecated"]);

function resourcesPreview(r: unknown, dash: string): string {
  if (r == null) return dash;
  try {
    const s = typeof r === "string" ? r : JSON.stringify(r);
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  } catch {
    return dash;
  }
}

function parsePoliciesListQuery(sp: URLSearchParams): {
  limit: number;
  policyCode: string;
  status: string;
  scopeType: string;
  bindingRole: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const policyCode = (sp.get("policy_code") ?? "").trim().slice(0, POLICY_CODE_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status: string = POLICY_STATUS_URL.has(rawSt) ? rawSt : "";
  const scopeType = (sp.get("scope_type") ?? "").trim().slice(0, SCOPE_TYPE_MAX);
  const bindingRole = (sp.get("binding_role") ?? "").trim().slice(0, BINDING_ROLE_MAX);
  return { limit, policyCode, status, scopeType, bindingRole };
}

function buildPoliciesListPath(q: {
  limit: number;
  policyCode: string;
  status: string;
  scopeType: string;
  bindingRole: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const pc = q.policyCode.trim().slice(0, POLICY_CODE_MAX);
  if (pc) sp.set("policy_code", pc);
  if (q.status === "draft" || q.status === "active" || q.status === "deprecated") {
    sp.set("status", q.status);
  }
  const st = q.scopeType.trim().slice(0, SCOPE_TYPE_MAX);
  if (st) sp.set("scope_type", st);
  const br = q.bindingRole.trim().slice(0, BINDING_ROLE_MAX);
  if (br) sp.set("binding_role", br);
  return `/admin/policies?${sp.toString()}`;
}

/** 70：数据权限策略台账；发布须 super_admin（04 §3.5）。 */
function AdminPoliciesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const policyCodeInputId = useId();
  const statusSelectId = useId();
  const scopeTypeInputId = useId();
  const bindingRoleInputId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const policiesActiveCodeDescId = useId();
  const policiesActiveStatusDescId = useId();
  const policiesActiveScopeTypeDescId = useId();
  const policiesActiveBindingRoleDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, policyCode, status, scopeType, bindingRole } = useMemo(
    () => parsePoliciesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<PolicyItem[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftPolicyCode, setDraftPolicyCode] = useState(policyCode);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftScopeType, setDraftScopeType] = useState(scopeType);
  const [draftBindingRole, setDraftBindingRole] = useState(bindingRole);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftPolicyCode(policyCode);
    setDraftStatus(status);
    setDraftScopeType(scopeType);
    setDraftBindingRole(bindingRole);
  }, [limit, policyCode, status, scopeType, bindingRole]);

  const [publishRow, setPublishRow] = useState<PolicyItem | null>(null);
  const [publishStatus, setPublishStatus] = useState<(typeof PUBLISH_STATUSES)[number]>("active");
  const [publishVersion, setPublishVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const closePublish = useCallback(() => {
    setPublishRow(null);
    setPublishError(null);
  }, []);

  const openPublish = (row: PolicyItem) => {
    setPublishError(null);
    setPublishRow(row);
    setPublishStatus("active");
    const v = row.policy?.version;
    setPublishVersion(v != null ? String(v) : "");
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-policies-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminPoliciesPage",
      apiUrl(
        routes.admin.policies({
          limit,
          ...(policyCode ? { policy_code: policyCode } : {}),
          ...(status === "draft" || status === "active" || status === "deprecated"
            ? { status }
            : {}),
          ...(scopeType ? { scope_type: scopeType } : {}),
          ...(bindingRole ? { binding_role: bindingRole } : {}),
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
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminPoliciesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, policyCode, status, scopeType, bindingRole, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildPoliciesListPath({
        limit: nextLimit,
        policyCode: draftPolicyCode.trim().slice(0, POLICY_CODE_MAX),
        status: draftStatus,
        scopeType: draftScopeType.trim().slice(0, SCOPE_TYPE_MAX),
        bindingRole: draftBindingRole.trim().slice(0, BINDING_ROLE_MAX),
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildPoliciesListPath({
        limit: nextLimit,
        policyCode: "",
        status: "",
        scopeType: "",
        bindingRole: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(policyCode) ||
    status === "draft" ||
    status === "active" ||
    status === "deprecated" ||
    Boolean(scopeType) ||
    Boolean(bindingRole);

  const submitPublish = useCallback(() => {
    const id = publishRow?.id?.trim();
    if (!id) return;
    const ev = Number.parseInt(publishVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setPublishError(t("admin_policies_publishBadVer"));
      return;
    }
    setPublishSubmitting(true);
    setPublishError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setPublishError(t("admin_policies_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<PublishRes>(
      "AdminPolicyPublish",
      apiUrl(routes.admin.policyPublish(id)),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ status: publishStatus, expected_version: ev }),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "admin_policy_version_conflict") {
          const cv = b.current_version;
          setPublishError(
            typeof cv === "number"
              ? t("admin_policies_publishConflict").replace("{{current}}", String(cv))
              : t("admin_policies_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminPolicyPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminPolicyPublish", e);
        const msg = e instanceof Error ? e.message : "";
        setPublishError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setPublishSubmitting(false));
  }, [closePublish, publishRow, publishStatus, publishVersion, t]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_policies_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_policies_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_policies_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-policies-filter-form"
          className="space-y-3"
          aria-label={t("admin_policies_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              policyCode ? policiesActiveCodeDescId : "",
              status === "draft" || status === "active" || status === "deprecated" ? policiesActiveStatusDescId : "",
              scopeType ? policiesActiveScopeTypeDescId : "",
              bindingRole ? policiesActiveBindingRoleDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_policies_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_policies_limit")}
              </label>
              <input
                id={limitInputId}
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </div>
            <div className="min-w-[10rem] flex-1">
              <label htmlFor={policyCodeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_policies_filter_policy_code")}
              </label>
              <input
                id={policyCodeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={POLICY_CODE_MAX}
                value={draftPolicyCode}
                onChange={(e) => setDraftPolicyCode(e.target.value.slice(0, POLICY_CODE_MAX))}
                placeholder={t("admin_policies_filter_policy_code_placeholder")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[9rem]">
              <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_policies_filter_status")}
              </label>
              <select
                id={statusSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">{t("admin_policies_status_any")}</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="deprecated">deprecated</option>
              </select>
            </div>
            <div className="min-w-[8rem] flex-1">
              <label htmlFor={scopeTypeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_policies_filter_scope_type")}
              </label>
              <input
                id={scopeTypeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={SCOPE_TYPE_MAX}
                value={draftScopeType}
                onChange={(e) => setDraftScopeType(e.target.value.slice(0, SCOPE_TYPE_MAX))}
                placeholder={t("admin_policies_filter_scope_type_placeholder")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[8rem] flex-1">
              <label htmlFor={bindingRoleInputId} className="block text-small font-medium text-ink-600">
                {t("admin_policies_filter_binding_role")}
              </label>
              <input
                id={bindingRoleInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={BINDING_ROLE_MAX}
                value={draftBindingRole}
                onChange={(e) => setDraftBindingRole(e.target.value.slice(0, BINDING_ROLE_MAX))}
                placeholder={t("admin_policies_filter_binding_role_placeholder")}
                autoComplete="off"
              />
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-policies-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_policies_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_policies_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
        <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
          {t("admin_policies_filter_hint")}
        </p>
        {policyCode ? (
          <p id={policiesActiveCodeDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_policies_active_policy_code").replace("{code}", policyCode)}
          </p>
        ) : null}
        {status === "draft" || status === "active" || status === "deprecated" ? (
          <p id={policiesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_policies_active_status").replace("{status}", status)}
          </p>
        ) : null}
        {scopeType ? (
          <p id={policiesActiveScopeTypeDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_policies_active_scope_type").replace("{type}", scopeType)}
          </p>
        ) : null}
        {bindingRole ? (
          <p id={policiesActiveBindingRoleDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_policies_active_binding_role").replace("{role}", bindingRole)}
          </p>
        ) : null}
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_policies_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_policies_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_policies_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colId")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colCode")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colPVer")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colPStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colScope")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colRole")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colResources")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colUpdated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_policies_colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={9}>
                    {t("admin_policies_empty")}
                  </td>
                </tr>
              )}
              {items.map((row, idx) => {
                const dash = t("admin_em_dash");
                const p = row.policy;
                const sc = row.scope;
                const b = row.binding;
                const resStr = resourcesPreview(b?.resources, dash);
                return (
                  <tr key={row.id ?? `pol-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[7rem] truncate" title={row.id}>
                      {row.id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{p?.status ?? dash}</td>
                    <td className="px-3 py-2 max-w-[10rem]">
                      <span className="block font-mono text-meta truncate" title={sc?.expr ?? ""}>
                        {sc?.type ?? dash}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{b?.role ?? dash}</td>
                    <td className="px-3 py-2 max-w-[12rem] font-mono text-meta">
                      <span className="block truncate" title={resStr}>
                        {resStr}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{row.updated_at ?? dash}</td>
                    <td className="px-3 py-2">
                      {row.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(row);
                          }}
                        >
                          <button
                            type="submit"
                            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                          >
                            {t("admin_policies_publish")}
                          </button>
                        </form>
                      ) : (
                        dash
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {publishRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={publishDialogTitleId}
          aria-describedby={publishDialogDescId}
        >
          <div className="max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
            <h2 id={publishDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_policies_publishTitle")}
            </h2>
            <p id={publishDialogDescId} className="mt-1 text-small text-ink-600">{t("admin_policies_publishSuperHint")}</p>
            <p className="mt-2 font-mono text-meta text-ink-700 break-all">{publishRow.policy?.code ?? publishRow.id}</p>
            <p id={publishModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
              {t("admin_policies_publish_filter_hint")}
            </p>

            <form
              aria-describedby={publishModalFilterHintId}
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closePublish();
                  return;
                }
                void submitPublish();
              }}
            >
            <label className="mt-4 block text-small text-ink-800">
              {t("admin_policies_publishStatus")}
              <select
                name="status"
                value={publishStatus}
                onChange={(e) => setPublishStatus(e.target.value as (typeof PUBLISH_STATUSES)[number])}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-3 py-2 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {PUBLISH_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-small text-ink-800">
              {t("admin_policies_publishVer")}
              <input
                type="text"
                name="expected_version"
                inputMode="numeric"
                value={publishVersion}
                onChange={(e) => setPublishVersion(e.target.value)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small"
              />
            </label>

            {publishError ? (
              <p className="mt-3 text-small text-danger" role="alert">
                {publishError}
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
                {t("admin_policies_publishCancel")}
              </button>
              <button
                type="submit"
                disabled={publishSubmitting}
                aria-busy={publishSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {publishSubmitting ? t("admin_policies_publishSubmitting") : t("admin_policies_publishSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminPoliciesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_policies_title">
      <AdminPoliciesPageInner />
    </AdminSearchParamsSuspense>
  );
}

