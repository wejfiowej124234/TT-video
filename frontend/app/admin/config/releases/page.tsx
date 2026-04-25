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

type Row = {
  id?: string;
  release_key?: string;
  version_label?: string;
  status?: string;
  effective_from?: string | null;
  rolled_back_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

const RELEASE_KEY_MAX_LEN = 256;
const STATUS_OPTIONS = ["draft", "published", "rolled_back"] as const;

function parseListQuery(sp: URLSearchParams): {
  limit: number;
  releaseKey: string;
  status: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const releaseKey = (sp.get("release_key") ?? "").trim().slice(0, RELEASE_KEY_MAX_LEN);
  const rawSt = (sp.get("status") ?? "").trim().toLowerCase();
  const status = STATUS_OPTIONS.includes(rawSt as (typeof STATUS_OPTIONS)[number]) ? rawSt : "";
  return { limit, releaseKey, status };
}

function buildListPath(q: { limit: number; releaseKey: string; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const rk = q.releaseKey.trim().slice(0, RELEASE_KEY_MAX_LEN);
  if (rk) sp.set("release_key", rk);
  if (q.status) sp.set("status", q.status);
  return `/admin/config/releases?${sp.toString()}`;
}

/** 220：配置发布登记只读（须 admin + DB）。 */
function AdminConfigReleasesPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const releaseKeyInputId = useId();
  const statusSelectId = useId();
  const limitInputId = useId();
  const adminFilterHintId = useId();
  const configReleasesActiveKeyDescId = useId();
  const configReleasesActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, releaseKey, status } = useMemo(
    () => parseListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listQueryString = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    if (releaseKey) sp.set("release_key", releaseKey);
    if (status) sp.set("status", status);
    return sp.toString();
  }, [limit, releaseKey, status]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftReleaseKey, setDraftReleaseKey] = useState(releaseKey);
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftReleaseKey(releaseKey);
    setDraftStatus(status);
  }, [limit, releaseKey, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-config-rel-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<Res>(
      "AdminConfigReleasesPage",
      apiUrl(
        routes.admin.configReleases({
          limit,
          ...(releaseKey ? { release_key: releaseKey } : {}),
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
        logAdminFetch("AdminConfigReleasesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, releaseKey, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildListPath({
        limit: nextLimit,
        releaseKey: draftReleaseKey.trim().slice(0, RELEASE_KEY_MAX_LEN),
        status: draftStatus,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildListPath({ limit: nextLimit, releaseKey: "", status: "" }));
  };

  const hasActiveFilters = Boolean(releaseKey) || Boolean(status);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_config_releases_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_config_releases_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_config_releases_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-config-releases-filter-form"
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          aria-label={t("admin_config_releases_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              releaseKey ? configReleasesActiveKeyDescId : "",
              status ? configReleasesActiveStatusDescId : "",
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
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={releaseKeyInputId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_filter_release_key")}
          </label>
          <input
            id={releaseKeyInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            maxLength={RELEASE_KEY_MAX_LEN}
            value={draftReleaseKey}
            onChange={(e) => setDraftReleaseKey(e.target.value.slice(0, RELEASE_KEY_MAX_LEN))}
            placeholder={t("admin_config_releases_filter_release_key_placeholder")}
            autoComplete="off"
          />
        </div>
        <div className="min-w-[11rem]">
          <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_filter_status")}
          </label>
          <select
            id={statusSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1.5 text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={draftStatus}
            onChange={(e) => setDraftStatus(e.target.value)}
          >
            <option value="">{t("admin_config_releases_status_any")}</option>
            <option value="draft">{t("admin_config_releases_status_draft")}</option>
            <option value="published">{t("admin_config_releases_status_published")}</option>
            <option value="rolled_back">{t("admin_config_releases_status_rolled_back")}</option>
          </select>
        </div>
        <div>
          <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
            {t("admin_config_releases_limit")}
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
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-config-releases-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_config_releases_apply")}
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
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_config_releases_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <p id={adminFilterHintId} className="mt-2 text-meta text-ink-500">
        {t("admin_config_releases_filter_hint")}
      </p>

      {releaseKey ? (
        <p id={configReleasesActiveKeyDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_config_releases_active_release_key", { key: releaseKey, colon: t("market_fin_colon") })}
        </p>
      ) : null}
      {status ? (
        <p id={configReleasesActiveStatusDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_config_releases_active_status", { status, colon: t("market_fin_colon") })}
        </p>
      ) : null}
      {appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline" className="mt-2">
          {t("admin_config_releases_applied")}
          {t("market_fin_colon")}
          {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_config_releases_loading")}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && (
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_config_releases_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colKey")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colLabel")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colEffective")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colRollback")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_config_releases_colUpdated")}</th>
                <th className="px-3 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_config_releases_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => (
                <tr key={r.id ?? `cr-${idx}`}>
                  <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={r.release_key}>
                    {r.release_key ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta">{r.version_label ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta">{r.status ?? t("admin_em_dash")}</td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.effective_from ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.rolled_back_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">
                    {r.updated_at ?? t("admin_em_dash")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.id ? (
                      <Link
                        href={`/admin/config/releases/${encodeURIComponent(r.id)}?relist=${encodeURIComponent(listQueryString)}`}
                        className={`${touchTargetLink44Classes} text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_config_releases_colOpen")}
                      </Link>
                    ) : (
                      t("admin_em_dash")
                    )}
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

export default function AdminConfigReleasesPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_config_releases_title">
      <AdminConfigReleasesPageInner />
    </AdminSearchParamsSuspense>
  );
}

