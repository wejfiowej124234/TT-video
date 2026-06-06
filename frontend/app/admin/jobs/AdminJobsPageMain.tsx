"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { JOB_STATUSES, trunc } from "./adminJobsPageModel";
import { useAdminJobsPage } from "./useAdminJobsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";

type JobSortKey = "status" | "updated_at";
export function AdminJobsPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const limitInputId = useId();
  const statusSelectId = useId();
  const adminFilterHintId = useId();
  const jobsActiveStatusDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const {
    status,
    loading,
    refreshing,
    error,
    summary,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    apply,
    clearStatusFilter,
    hasStatusFilter,
  } = useAdminJobsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<JobSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "updated_at") return r.updated_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_jobs_title")}
      subtitle={t("admin_jobs_subtitle_l5")}
      headerAside={
        <AdminInboxQueueBackLinks />
      }
    >
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
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
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor={limitInputId} className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
                {t("admin_jobs_limit")}
              </label>
              <input
                id={limitInputId}
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`mt-1 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </div>
            <div>
              <label htmlFor={statusSelectId} className={`block ${ADMIN_FILTER_FIELD_LABEL_CLASS}`}>
                {t("admin_jobs_status")}
              </label>
              <select
                id={statusSelectId}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`mt-1 inline-flex min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
              {t("admin_jobs_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
            </AdminAppliedFiltersBanner>
          ) : null}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            form="admin-jobs-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
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
                className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_jobs_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {summary && Object.keys(summary).length > 0 ? (
        <section
          className={`mt-4 ${ADMIN_FILTER_CARD_CLASS}`}
          aria-label={t("admin_jobs_summary_aria")}
        >
          <h2 className="text-small font-semibold text-ink-700">{t("admin_jobs_summary")}</h2>
          <pre className={`mt-2 max-h-32 overflow-auto ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}>
            {JSON.stringify(summary, null, 2)}
          </pre>
        </section>
      ) : null}

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_jobs_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_jobs_empty"
          nextLinks={[
            { href: "/admin/scheduler/jobs", labelKey: "admin_scheduler_jobs_title" },
            { href: "/admin/observability", labelKey: "admin_observability_title" },
          ]}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_jobs_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_jobs_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_jobs_colQueue")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_jobs_colType")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_jobs_colAttempts")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_jobs_colError")}
                </th>
                <AdminSortableTh
                  label={t("admin_jobs_colUpdated")}
                  ariaSort={ariaSort("updated_at")}
                  onToggle={() => toggle("updated_at")}
                />
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `job-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[8rem] truncate" title={r.queue_name}>
                      {r.queue_name ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[10rem] truncate" title={r.job_type}>
                      {r.job_type ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">
                      {r.attempt_count ?? dash}/{r.max_attempts ?? dash}
                    </td>
                    <td className="px-3 py-2 max-w-xs font-mono text-small text-ink-800">
                      <span className="block truncate" title={r.last_error ?? ""}>
                        {trunc(r.last_error, 80, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.updated_at ?? dash}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </AdminListPageChrome>
  );
}
