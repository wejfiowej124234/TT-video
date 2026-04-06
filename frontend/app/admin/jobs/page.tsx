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

const JOB_STATUSES = ["", "pending", "running", "completed", "failed", "dead_letter", "cancelled"] as const;
const JOB_STATUS_SET = new Set<string>([
  "pending",
  "running",
  "completed",
  "failed",
  "dead_letter",
  "cancelled",
]);

type JobRow = {
  id?: string;
  queue_name?: string;
  job_type?: string;
  status?: string;
  attempt_count?: number;
  max_attempts?: number;
  last_error?: string | null;
  payload_ref?: string | null;
  idempotency_key?: string | null;
  scheduled_for?: string | null;
  created_at?: string;
  updated_at?: string;
};

type JobsRes = {
  status?: string;
  error?: string;
  summary?: Record<string, number>;
  items?: JobRow[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

function parseJobsListQuery(sp: URLSearchParams): { limit: number; status: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const rawSt = (sp.get("status") ?? "").trim();
  const status = JOB_STATUS_SET.has(rawSt) ? rawSt : "";
  return { limit, status };
}

function buildJobsListPath(q: { limit: number; status: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  if (q.status) sp.set("status", q.status);
  return `/admin/jobs?${sp.toString()}`;
}

function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** 250：异步任务队列只读（须 admin + DB）。 */
function AdminJobsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const statusSelectId = useId();
  const adminFilterHintId = useId();
  const jobsActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, status } = useMemo(
    () => parseJobsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [items, setItems] = useState<JobRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
  }, [limit, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-jobs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.jobs({
      limit,
      status: status || undefined,
    });

    adminFetchJson<JobsRes>("AdminJobsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setSummary(body.summary && typeof body.summary === "object" ? body.summary : null);
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminJobsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(buildJobsListPath({ limit: nextLimit, status: draftStatus }));
  };

  const clearStatusFilter = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildJobsListPath({ limit: nextLimit, status: "" }));
  };

  const hasStatusFilter = Boolean(status);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_jobs_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_jobs_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_jobs_back")}
          </Link>
        </div>
      </header>

      <div className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4 space-y-3">
        <form
          id="admin-jobs-filter-form"
          aria-label={t("admin_jobs_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              status ? jobsActiveStatusDescId : "",
              appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_jobs_filters")}</p>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={limitInputId} className="block text-small text-ink-700">
                {t("admin_jobs_limit")}
              </label>
              <input
                id={limitInputId}
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              />
            </div>
            <div>
              <label htmlFor={statusSelectId} className="block text-small text-ink-700">
                {t("admin_jobs_status")}
              </label>
              <select
                id={statusSelectId}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`mt-1 inline-flex min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {JOB_STATUSES.map((v) => (
                  <option key={v || "all"} value={v}>
                    {v === "" ? t("admin_jobs_statusAll") : v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p id={adminFilterHintId} className="text-meta text-ink-500">
            {t("admin_jobs_filter_hint")}
          </p>
          {status ? (
            <p id={jobsActiveStatusDescId} className="text-meta text-ink-600">
              {t("admin_jobs_active_status").replace("{status}", status)}
            </p>
          ) : null}
          {appliedFilters ? (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
              {t("admin_jobs_applied")}: {JSON.stringify(appliedFilters)}
            </AdminAppliedFiltersBanner>
          ) : null}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            form="admin-jobs-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_jobs_apply")}
          </button>
          {hasStatusFilter ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                clearStatusFilter();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_jobs_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {summary && Object.keys(summary).length > 0 ? (
        <section
          className="mt-4 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4"
          aria-label={t("admin_jobs_summary_aria")}
        >
          <h2 className="text-small font-semibold text-ink-700">{t("admin_jobs_summary")}</h2>
          <pre className="mt-2 max-h-32 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
            {JSON.stringify(summary, null, 2)}
          </pre>
        </section>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_jobs_loading")}
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
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_jobs_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colQueue")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colType")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colAttempts")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colError")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_jobs_colUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={6}>
                    {t("admin_jobs_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `job-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[8rem] truncate" title={r.queue_name}>
                      {r.queue_name ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta max-w-[10rem] truncate" title={r.job_type}>
                      {r.job_type ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">
                      {r.attempt_count ?? dash}/{r.max_attempts ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-xs font-mono text-meta">
                      <span className="block truncate" title={r.last_error ?? ""}>
                        {trunc(r.last_error, 80, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.updated_at ?? dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

export default function AdminJobsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_jobs_title">
      <AdminJobsPageInner />
    </AdminSearchParamsSuspense>
  );
}

