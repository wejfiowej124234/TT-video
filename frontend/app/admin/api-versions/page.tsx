"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type ApiVersionRow = {
  api_version?: string;
  status?: string;
  released_at?: string | null;
  deprecated_at?: string | null;
  sunset_at?: string | null;
  compat_window_days?: number | null;
  active_client_ratio_7d?: number | null;
  request_count_7d?: number | null;
  last_change_at?: string;
  last_change_by?: string;
};

type ApiVersionsRes = {
  status?: string;
  error?: string;
  items?: ApiVersionRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const API_VER_SUB_MAX = 128;
const API_STATUS_URL = new Set(["planned", "active", "deprecated", "sunset"]);

function parseApiVersionsListQuery(sp: URLSearchParams): {
  limit: number;
  apiVersion: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const apiVersion = (sp.get("api_version") ?? "").trim().slice(0, API_VER_SUB_MAX);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status: string = API_STATUS_URL.has(rawSt) ? rawSt : "";
  return { limit, apiVersion, status };
}

function buildApiVersionsListPath(q: {
  limit: number;
  apiVersion: string;
  status: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const av = q.apiVersion.trim().slice(0, API_VER_SUB_MAX);
  if (av) sp.set("api_version", av);
  if (q.status === "planned" || q.status === "active" || q.status === "deprecated" || q.status === "sunset") {
    sp.set("status", q.status);
  }
  return `/admin/api-versions?${sp.toString()}`;
}

/** 340 / 70：API 版本台账只读（须 admin + DB）。 */
function AdminApiVersionsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const versionInputId = useId();
  const statusInputId = useId();
  const adminFilterHintId = useId();
  const apiVersionsActiveVersionDescId = useId();
  const apiVersionsActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, apiVersion, status } = useMemo(
    () => parseApiVersionsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ApiVersionRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftApiVersion, setDraftApiVersion] = useState(apiVersion);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftApiVersion(apiVersion);
    setDraftStatus(status);
  }, [limit, apiVersion, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-api-versions-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    adminFetchJson<ApiVersionsRes>(
      "AdminApiVersionsPage",
      apiUrl(
        routes.admin.apiVersions({
          limit: effLimit,
          ...(apiVersion ? { api_version: apiVersion } : {}),
          ...(status ? { status } : {}),
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
        logAdminFetch("AdminApiVersionsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, apiVersion, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const st = draftStatus.trim().toLowerCase();
    const nextStatus = API_STATUS_URL.has(st) ? st : "";
    router.push(
      buildApiVersionsListPath({
        limit: nextLimit,
        apiVersion: draftApiVersion.trim().slice(0, API_VER_SUB_MAX),
        status: nextStatus,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildApiVersionsListPath({
        limit: nextLimit,
        apiVersion: "",
        status: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(apiVersion) || Boolean(status);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_api_versions_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_api_versions_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_api_versions_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-api-versions-filter-form"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("admin_api_versions_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              apiVersion ? apiVersionsActiveVersionDescId : "",
              status ? apiVersionsActiveStatusDescId : "",
              appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className="w-full text-meta text-ink-600 leading-relaxed sm:basis-full">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_api_versions_limit")}
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
            <label htmlFor={versionInputId} className="block text-small font-medium text-ink-600">
              {t("admin_api_versions_filter_version")}
            </label>
            <input
              id={versionInputId}
              className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              maxLength={API_VER_SUB_MAX}
              value={draftApiVersion}
              onChange={(e) => setDraftApiVersion(e.target.value.slice(0, API_VER_SUB_MAX))}
              placeholder={t("admin_api_versions_filter_version_placeholder")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[10rem]">
            <label htmlFor={statusInputId} className="block text-small font-medium text-ink-600">
              {t("admin_api_versions_filter_status")}
            </label>
            <select
              id={statusInputId}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
              <option value="">{t("admin_api_versions_filter_status_any")}</option>
              <option value="planned">planned</option>
              <option value="active">active</option>
              <option value="deprecated">deprecated</option>
              <option value="sunset">sunset</option>
            </select>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-api-versions-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_api_versions_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearNonLimitFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_api_versions_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_api_versions_filter_hint")}
      </p>
      {apiVersion ? (
        <p id={apiVersionsActiveVersionDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_api_versions_active_version").replace("{v}", apiVersion)}
        </p>
      ) : null}
      {status ? (
        <p id={apiVersionsActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_api_versions_active_status").replace("{s}", status)}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_api_versions_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_api_versions_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && (
        <section
          className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_api_versions_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colVersion")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colReleased")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colDeprecated")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colSunset")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colCompatDays")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colReq7d")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_api_versions_colChanged")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={8}>
                    {t("admin_api_versions_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, i) => (
                <tr key={`${r.api_version ?? i}-${i}`}>
                  <td className="px-3 py-2 font-mono text-meta">{r.api_version ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.status ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.released_at ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.deprecated_at ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.sunset_at ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.compat_window_days ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.request_count_7d ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap max-w-[12rem] truncate" title={r.last_change_by}>
                    {r.last_change_at ?? t("admin_em_dash")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminApiVersionsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_api_versions_title">
      <AdminApiVersionsPageInner />
    </AdminSearchParamsSuspense>
  );
}

