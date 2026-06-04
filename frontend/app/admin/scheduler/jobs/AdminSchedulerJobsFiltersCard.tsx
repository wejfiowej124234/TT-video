"use client";

import type { FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { JOB_CODE_MAX_LEN, sanitizeJobCodeInput } from "./adminSchedulerJobsPageModel";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS } from "@/lib/adminUi";
type AdminSchedulerJobsFiltersCardProps = {
  limitInputId: string;
  jobCodeInputId: string;
  adminListApplyResetHintId: string;
  adminFilterHintId: string;
  schedulerActiveJobCodeDescId: string;
  adminAppliedFiltersDescId: string;
  jobCode: string;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftJobCode: string;
  setDraftJobCode: (v: string) => void;
  apply: (e?: FormEvent) => void;
  resetJobCodeFilter: () => void;
  hasJobCodeFilter: boolean;
};

export function AdminSchedulerJobsFiltersCard({
  limitInputId,
  jobCodeInputId,
  adminListApplyResetHintId,
  adminFilterHintId,
  schedulerActiveJobCodeDescId,
  adminAppliedFiltersDescId,
  jobCode,
  loading,
  error,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftJobCode,
  setDraftJobCode,
  apply,
  resetJobCodeFilter,
  hasJobCodeFilter,
}: AdminSchedulerJobsFiltersCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
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
              className={`mt-1 min-h-[44px] w-20 rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
              className={`mt-1 w-full max-w-sm min-h-[44px] rounded-[var(--radius-sm)] border border-ink-200 bg-white px-2 py-1 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 transition-colors motion-reduce:transition-none hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
  );
}
