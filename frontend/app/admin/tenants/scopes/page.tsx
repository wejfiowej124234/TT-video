"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
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

type Row = {
  id?: string;
  tenant_key?: string;
  region_code?: string;
  scope_class?: string;
  status?: string;
  notes?: string | null;
  version?: number;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type PublishRes = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: Row;
};

const PUBLISH_STATUSES = ["draft", "active", "sunset"] as const;

const TENANT_KEY_MAX = 256;
const REGION_MAX = 128;
const TENANT_SCOPE_STATUSES = new Set<string>(["draft", "active", "sunset"]);
const TENANT_SCOPE_CLASSES = new Set<string>(["data_residency", "ops", "feature", "network"]);

function parseTenantScopesListQuery(sp: URLSearchParams): {
  limit: number;
  tenantKey: string;
  regionCode: string;
  status: string;
  scopeClass: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const tenantKey = (sp.get("tenant_key") ?? "").trim().slice(0, TENANT_KEY_MAX);
  const regionCode = (sp.get("region_code") ?? "").trim().slice(0, REGION_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = TENANT_SCOPE_STATUSES.has(rawSt) ? rawSt : "";
  const rawCl = (sp.get("scope_class") ?? "").trim().toLowerCase();
  const scopeClass = TENANT_SCOPE_CLASSES.has(rawCl) ? rawCl : "";
  return { limit, tenantKey, regionCode, status, scopeClass };
}

function buildTenantScopesListPath(q: {
  limit: number;
  tenantKey: string;
  regionCode: string;
  status: string;
  scopeClass: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const tk = q.tenantKey.trim().slice(0, TENANT_KEY_MAX);
  if (tk) sp.set("tenant_key", tk);
  const rg = q.regionCode.trim().slice(0, REGION_MAX);
  if (rg) sp.set("region_code", rg);
  if (q.status) sp.set("status", q.status);
  if (q.scopeClass) sp.set("scope_class", q.scopeClass);
  return `/admin/tenants/scopes?${sp.toString()}`;
}

/** 320 / 70：租户作用域台账；发布须 super_admin（04 §3.5）。 */
function AdminTenantScopesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const tenantKeyInputId = useId();
  const regionCodeInputId = useId();
  const statusSelectId = useId();
  const scopeClassSelectId = useId();
  const publishDialogTitleId = useId();
  const publishDialogDescId = useId();
  const publishModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const tenantScopesActiveKeyDescId = useId();
  const tenantScopesActiveRegionDescId = useId();
  const tenantScopesActiveStatusDescId = useId();
  const tenantScopesActiveScopeClassDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, tenantKey, regionCode, status, scopeClass } = useMemo(
    () => parseTenantScopesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftTenantKey, setDraftTenantKey] = useState(tenantKey);
  const [draftRegionCode, setDraftRegionCode] = useState(regionCode);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftScopeClass, setDraftScopeClass] = useState(scopeClass);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftTenantKey(tenantKey);
    setDraftRegionCode(regionCode);
    setDraftStatus(status);
    setDraftScopeClass(scopeClass);
  }, [limit, tenantKey, regionCode, status, scopeClass]);

  const [publishRow, setPublishRow] = useState<Row | null>(null);
  const [publishStatus, setPublishStatus] = useState<(typeof PUBLISH_STATUSES)[number]>("active");
  const [publishVersion, setPublishVersion] = useState("");
  const [publishSubmitting, setPublishSubmitting] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const openPublish = (r: Row) => {
    setPublishError(null);
    setPublishRow(r);
    setPublishStatus("active");
    setPublishVersion(r.version != null ? String(r.version) : "");
  };

  const closePublish = useCallback(() => {
    setPublishRow(null);
    setPublishError(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-tenant-scopes-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminTenantScopesPage",
      apiUrl(
        routes.admin.tenantScopes({
          limit,
          ...(tenantKey ? { tenant_key: tenantKey } : {}),
          ...(regionCode ? { region_code: regionCode } : {}),
          ...(status ? { status } : {}),
          ...(scopeClass ? { scope_class: scopeClass } : {}),
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
        logAdminFetch("AdminTenantScopesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, tenantKey, regionCode, status, scopeClass, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildTenantScopesListPath({
        limit: nextLimit,
        tenantKey: draftTenantKey.trim().slice(0, TENANT_KEY_MAX),
        regionCode: draftRegionCode.trim().slice(0, REGION_MAX),
        status: draftStatus,
        scopeClass: draftScopeClass,
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildTenantScopesListPath({
        limit: nextLimit,
        tenantKey: "",
        regionCode: "",
        status: "",
        scopeClass: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(tenantKey) || Boolean(regionCode) || Boolean(status) || Boolean(scopeClass);

  const submitPublish = useCallback(() => {
    if (!publishRow?.id?.trim()) return;
    const ev = Number.parseInt(publishVersion.trim(), 10);
    if (!Number.isFinite(ev)) {
      setPublishError(t("admin_tenant_scopes_publishBadVer"));
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
      setPublishError(t("admin_tenant_scopes_publishAuth"));
      setPublishSubmitting(false);
      return;
    }

    void adminFetchJson<PublishRes>(
      "AdminTenantScopesPublish",
      apiUrl(routes.admin.tenantScopePublish(publishRow.id.trim())),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ status: publishStatus, expected_version: ev }),
      },
    )
      .then(({ res, body: b }) => {
        if (res.status === 409 && b?.error === "admin_tenant_scope_version_conflict") {
          const cv = b.current_version;
          setPublishError(
            typeof cv === "number"
              ? t("admin_tenant_scopes_publishConflict").replace("{{current}}", String(cv))
              : t("admin_tenant_scopes_publishConflictGeneric"),
          );
          return;
        }
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminTenantScopesPublish", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closePublish();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminTenantScopesPublish", e);
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
            {t("admin_tenant_scopes_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_tenant_scopes_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_tenant_scopes_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id="admin-tenant-scopes-filter-form"
          className="space-y-3"
          aria-label={t("admin_tenant_scopes_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              tenantKey ? tenantScopesActiveKeyDescId : "",
              regionCode ? tenantScopesActiveRegionDescId : "",
              status ? tenantScopesActiveStatusDescId : "",
              scopeClass ? tenantScopesActiveScopeClassDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_tenant_scopes_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[8rem]">
              <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
                {t("admin_tenant_scopes_limit")}
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
              <label htmlFor={tenantKeyInputId} className="block text-small font-medium text-ink-600">
                {t("admin_tenant_scopes_filter_tenant_key")}
              </label>
              <input
                id={tenantKeyInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={TENANT_KEY_MAX}
                value={draftTenantKey}
                onChange={(e) => setDraftTenantKey(e.target.value.slice(0, TENANT_KEY_MAX))}
                placeholder={t("admin_tenant_scopes_filter_tenant_key_placeholder")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[8rem] flex-1">
              <label htmlFor={regionCodeInputId} className="block text-small font-medium text-ink-600">
                {t("admin_tenant_scopes_filter_region_code")}
              </label>
              <input
                id={regionCodeInputId}
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                maxLength={REGION_MAX}
                value={draftRegionCode}
                onChange={(e) => setDraftRegionCode(e.target.value.slice(0, REGION_MAX))}
                placeholder={t("admin_tenant_scopes_filter_region_code_placeholder")}
                autoComplete="off"
              />
            </div>
            <div className="min-w-[9rem]">
              <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_tenant_scopes_filter_status")}
              </label>
              <select
                id={statusSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                <option value="">{t("admin_tenant_scopes_status_any")}</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="sunset">sunset</option>
              </select>
            </div>
            <div className="min-w-[11rem]">
              <label htmlFor={scopeClassSelectId} className="block text-small font-medium text-ink-600">
                {t("admin_tenant_scopes_filter_scope_class")}
              </label>
              <select
                id={scopeClassSelectId}
                className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={draftScopeClass}
                onChange={(e) => setDraftScopeClass(e.target.value)}
              >
                <option value="">{t("admin_tenant_scopes_scope_class_any")}</option>
                <option value="data_residency">data_residency</option>
                <option value="ops">ops</option>
                <option value="feature">feature</option>
                <option value="network">network</option>
              </select>
            </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form="admin-tenant-scopes-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_tenant_scopes_apply")}
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
                {t("admin_tenant_scopes_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
        <p id={adminFilterHintId} className="mt-3 text-meta text-ink-500">
          {t("admin_tenant_scopes_filter_hint")}
        </p>
        {tenantKey ? (
          <p id={tenantScopesActiveKeyDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_tenant_scopes_active_tenant_key").replace("{key}", tenantKey)}
          </p>
        ) : null}
        {regionCode ? (
          <p id={tenantScopesActiveRegionDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_tenant_scopes_active_region").replace("{region}", regionCode)}
          </p>
        ) : null}
        {status ? (
          <p id={tenantScopesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_tenant_scopes_active_status").replace("{status}", status)}
          </p>
        ) : null}
        {scopeClass ? (
          <p id={tenantScopesActiveScopeClassDescId} className="mt-1 text-meta text-ink-600">
            {t("admin_tenant_scopes_active_scope_class").replace("{class}", scopeClass)}
          </p>
        ) : null}
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_tenant_scopes_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_tenant_scopes_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-4">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_tenant_scopes_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colTenant")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colRegion")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colClass")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colVer")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colUpdated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_tenant_scopes_colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_tenant_scopes_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `ts-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[10rem] truncate" title={r.tenant_key}>
                      {r.tenant_key ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.region_code ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.scope_class ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.version ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.updated_at ?? dash}</td>
                    <td className="px-3 py-2">
                      {r.id ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openPublish(r);
                          }}
                        >
                          <button
                            type="submit"
                            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
                          >
                            {t("admin_tenant_scopes_publish")}
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
              {t("admin_tenant_scopes_publishTitle")}
            </h2>
            <p id={publishDialogDescId} className="mt-1 text-small text-ink-600">
              {t("admin_tenant_scopes_publishSuperHint")}
            </p>
            <p className="mt-2 font-mono text-meta text-ink-700 break-all">{publishRow.tenant_key}</p>
            <p id={publishModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
              {t("admin_tenant_scopes_publish_filter_hint")}
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
              {t("admin_tenant_scopes_publishStatus")}
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
              {t("admin_tenant_scopes_publishVer")}
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
                {t("admin_tenant_scopes_publishCancel")}
              </button>
              <button
                type="submit"
                disabled={publishSubmitting}
                aria-busy={publishSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {publishSubmitting ? t("admin_tenant_scopes_publishSubmitting") : t("admin_tenant_scopes_publishSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminTenantScopesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_tenant_scopes_title">
      <AdminTenantScopesPageInner />
    </AdminSearchParamsSuspense>
  );
}

