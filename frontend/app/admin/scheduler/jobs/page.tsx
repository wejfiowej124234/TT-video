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
  job_code?: string;
  status?: string;
  trigger_source?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  error_summary?: string | null;
  created_at?: string;
};

type Res = {
  status?: string;
  error?: string;
  items?: Row[];
  applied_filters?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type RerunRes = { status?: string; error?: string };

const JOB_CODE_MAX_LEN = 160;

function sanitizeJobCodeInput(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, JOB_CODE_MAX_LEN);
}

function parseSchedulerListQuery(sp: URLSearchParams): { limit: number; jobCode: string } {
  let limit = Number.parseInt(sp.get("limit") ?? "50", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  limit = Math.min(200, Math.floor(limit));
  const jobCode = sanitizeJobCodeInput(sp.get("job_code") ?? "");
  return { limit, jobCode };
}

function buildSchedulerListPath(q: { limit: number; jobCode: string }): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(q.limit));
  const jc = sanitizeJobCodeInput(q.jobCode);
  if (jc) sp.set("job_code", jc);
  return `/admin/scheduler/jobs?${sp.toString()}`;
}

function trunc(s: string | null | undefined, max: number, dash: string): string {
  if (s == null || s === "") return dash;
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** 260：调度运行记录；补跑登记须 super_admin（04 §3.5）。 */
function AdminSchedulerJobsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const jobCodeInputId = useId();
  const rerunDialogTitleId = useId();
  const rerunDialogDescId = useId();
  const rerunReasonInputId = useId();
  const rerunErrorId = useId();
  const rerunModalFilterHintId = useId();
  const adminFilterHintId = useId();
  const schedulerActiveJobCodeDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, jobCode } = useMemo(
    () => parseSchedulerListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftJobCode, setDraftJobCode] = useState(jobCode);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftJobCode(jobCode);
  }, [limit, jobCode]);

  const [rerunCode, setRerunCode] = useState<string | null>(null);
  const [rerunReason, setRerunReason] = useState("");
  const [rerunSubmitting, setRerunSubmitting] = useState(false);
  const [rerunError, setRerunError] = useState<string | null>(null);

  const closeRerun = useCallback(() => {
    setRerunCode(null);
    setRerunReason("");
    setRerunError(null);
  }, []);

  const openRerun = (code: string) => {
    setRerunError(null);
    setRerunReason("");
    setRerunCode(code.trim());
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-scheduler-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.schedulerJobs({
      limit,
      job_code: jobCode || undefined,
    });

    adminFetchJson<Res>("AdminSchedulerJobsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminSchedulerJobsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, jobCode, reloadTick]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildSchedulerListPath({
        limit: nextLimit,
        jobCode: sanitizeJobCodeInput(draftJobCode),
      }),
    );
  };

  const resetJobCodeFilter = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildSchedulerListPath({ limit: nextLimit, jobCode: "" }));
  };

  const hasJobCodeFilter = Boolean(jobCode);

  const submitRerun = useCallback(() => {
    const code = rerunCode?.trim();
    if (!code) return;
    setRerunSubmitting(true);
    setRerunError(null);

    let headers: Record<string, string>;
    try {
      headers = {
        ...writeRequestHeaders(),
        "Content-Type": "application/json",
      };
    } catch {
      setRerunError(t("admin_scheduler_rerunAuth"));
      setRerunSubmitting(false);
      return;
    }

    const body: Record<string, unknown> = {};
    const r = rerunReason.trim();
    if (r !== "") body.reason = r;

    void adminFetchJson<RerunRes>(
      "AdminSchedulerRerun",
      apiUrl(routes.admin.schedulerJobRerun(code)),
      { method: "POST", headers, body: JSON.stringify(body) },
    )
      .then(({ res, body: b }) => {
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        if (b.status !== "ok") {
          adminLogApiJsonStatus("AdminSchedulerRerun", b);
          throw new Error(typeof b.error === "string" ? b.error : "request_failed");
        }
        setReloadTick((x) => x + 1);
        closeRerun();
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminSchedulerRerun", e);
        const msg = e instanceof Error ? e.message : "";
        setRerunError(adminApiErrorUserText(msg.trim() || undefined, t));
      })
      .finally(() => setRerunSubmitting(false));
  }, [closeRerun, rerunCode, rerunReason, t]);

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_scheduler_jobs_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_scheduler_jobs_subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-small">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_scheduler_jobs_back")}
          </Link>
        </div>
      </header>

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 space-y-3">
        <form
          id="admin-scheduler-jobs-filter-form"
          aria-label={t("admin_scheduler_jobs_filters")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              adminFilterHintId,
              jobCode ? schedulerActiveJobCodeDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_scheduler_jobs_filters")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={limitInputId} className="block text-small text-ink-700">
                {t("admin_scheduler_jobs_limit")}
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
            <div className="min-w-[10rem] flex-1">
              <label htmlFor={jobCodeInputId} className="block text-small text-ink-700">
                {t("admin_scheduler_jobs_jobCode")}
              </label>
              <input
                id={jobCodeInputId}
                type="text"
                value={draftJobCode}
                onChange={(e) => setDraftJobCode(sanitizeJobCodeInput(e.target.value))}
                className={`mt-1 w-full max-w-sm min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_scheduler_jobs_jobCodePh")}
                autoComplete="off"
                maxLength={JOB_CODE_MAX_LEN}
              />
            </div>
          </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-scheduler-jobs-filter-form"
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_scheduler_jobs_apply")}
          </button>
          {hasJobCodeFilter ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetJobCodeFilter();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_scheduler_jobs_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
        <p id={adminFilterHintId} className="text-meta text-ink-500">
          {t("admin_scheduler_jobs_filter_hint")}
        </p>
        {jobCode ? (
          <p id={schedulerActiveJobCodeDescId} className="text-meta text-ink-600">
            {t("admin_scheduler_jobs_active_job_code", { code: jobCode, colon: t("market_fin_colon") })}
          </p>
        ) : null}
        <p className="text-small text-ink-600">{t("admin_scheduler_rerunHint")}</p>
      </div>

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_scheduler_jobs_applied")}
          {t("market_fin_colon")}
          {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_scheduler_jobs_loading")}
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
        <section className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white" aria-label={t("admin_scheduler_jobs_table_aria")}>
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className="bg-bg-console text-ink-700">
              <tr>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colCode")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colStatus")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colTrigger")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colStarted")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colFinished")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colError")}</th>
                <th className="px-3 py-3 font-medium">{t("admin_scheduler_jobs_colRerun")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 text-ink-700">
              {items.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-ink-500" colSpan={7}>
                    {t("admin_scheduler_jobs_empty")}
                  </td>
                </tr>
              )}
              {items.map((r, idx) => {
                const jc = r.job_code?.trim() ?? "";
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `sj-${idx}`}>
                    <td className="px-3 py-2 font-mono text-meta max-w-[12rem] truncate" title={r.job_code}>
                      {r.job_code ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta">{r.trigger_source ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.started_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-meta whitespace-nowrap">{r.finished_at ?? dash}</td>
                    <td className="px-3 py-2 max-w-md font-mono text-meta">
                      <span className="block truncate" title={r.error_summary ?? ""}>
                        {trunc(r.error_summary, 96, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {jc ? (
                        <form
                          className="inline"
                          onSubmit={(e) => {
                            e.preventDefault();
                            openRerun(jc);
                          }}
                        >
                          <button
                            type="submit"
                            className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                          >
                            {t("admin_scheduler_rerun")}
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

      {rerunCode ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={rerunDialogTitleId}
          aria-describedby={rerunDialogDescId}
        >
          <div className="max-w-md w-full rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-medium">
            <h2 id={rerunDialogTitleId} className="text-body-l font-semibold text-ink-900">
              {t("admin_scheduler_rerunTitle")}
            </h2>
            <p id={rerunDialogDescId} className="mt-1 text-small text-ink-600">{t("admin_scheduler_rerunSuperHint")}</p>
            <p className="mt-2 font-mono text-meta text-ink-700 break-all">{rerunCode}</p>
            <p id={rerunModalFilterHintId} className="mt-3 text-meta text-ink-600 leading-relaxed">
              {t("admin_scheduler_rerun_filter_hint")}
            </p>

            <form
              aria-describedby={rerunModalFilterHintId}
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                if (sub?.name === "admin_modal_intent" && sub.value === "cancel") {
                  closeRerun();
                  return;
                }
                void submitRerun();
              }}
            >
            <label htmlFor={rerunReasonInputId} className="mt-4 block text-small text-ink-800">
              {t("admin_scheduler_rerunReason")}
              <input
                id={rerunReasonInputId}
                type="text"
                name="reason"
                value={rerunReason}
                onChange={(e) => setRerunReason(e.target.value)}
                aria-invalid={!!rerunError}
                aria-errormessage={rerunError ? rerunErrorId : undefined}
                className={`mt-1 min-h-[44px] w-full rounded-[var(--radius-sm)] border border-ink-200 px-3 py-2 font-mono text-small ${travelFocusRingCoreOffset2WhiteClasses}`}
                placeholder={t("admin_scheduler_rerunReasonPh")}
              />
            </label>

            {rerunError ? (
              <p id={rerunErrorId} className="mt-3 text-small text-danger" role="alert">
                {rerunError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="admin_modal_intent"
                value="cancel"
                formNoValidate
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 px-4 py-2 text-small text-ink-800 transition-colors motion-reduce:transition-none hover:bg-bg-console ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_scheduler_rerunCancel")}
              </button>
              <button
                type="submit"
                disabled={rerunSubmitting}
                aria-busy={rerunSubmitting ? true : undefined}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white transition-colors motion-reduce:transition-none hover:bg-travel-600 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {rerunSubmitting ? t("admin_scheduler_rerunSubmitting") : t("admin_scheduler_rerunSubmit")}
              </button>
            </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function AdminSchedulerJobsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_scheduler_jobs_title">
      <AdminSchedulerJobsPageInner />
    </AdminSearchParamsSuspense>
  );
}

