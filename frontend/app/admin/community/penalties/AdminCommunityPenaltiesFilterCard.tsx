"use client";

import type { FormEvent } from "react";
import type { AdminCommunityPenaltiesPageViewModel } from "./useAdminCommunityPenaltiesPage";
import {ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";
type Props = Pick<
  AdminCommunityPenaltiesPageViewModel,
  | "t"
  | "apply"
  | "resetFilters"
  | "hasActiveFilters"
  | "limitInputId"
  | "subjectInputId"
  | "reportIdInputId"
  | "statusSelectId"
  | "adminListApplyResetHintId"
  | "adminAppliedFiltersDescId"
  | "draftLimit"
  | "setDraftLimit"
  | "draftSubject"
  | "setDraftSubject"
  | "draftReportId"
  | "setDraftReportId"
  | "draftStatus"
  | "setDraftStatus"
  | "loading"
  | "error"
  | "appliedFilters"
  | "penaltyStatusOptions"
>;

export function AdminCommunityPenaltiesFilterCard({
  t,
  apply,
  resetFilters,
  hasActiveFilters,
  limitInputId,
  subjectInputId,
  reportIdInputId,
  statusSelectId,
  adminListApplyResetHintId,
  adminAppliedFiltersDescId,
  draftLimit,
  setDraftLimit,
  draftSubject,
  setDraftSubject,
  draftReportId,
  setDraftReportId,
  draftStatus,
  setDraftStatus,
  loading,
  error,
  appliedFilters,
  penaltyStatusOptions,
}: Props) {
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`}>
      <form
        id="admin-penalties-filter-form"
        className="space-y-3"
        aria-label={t("admin_penalties_filters")}
        aria-describedby={
          [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <p className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_penalties_filters")}</p>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[8rem]">
            <label htmlFor={limitInputId} className="block text-small font-medium text-ink-600">
              {t("admin_penalties_limit")}
            </label>
            <input
              id={limitInputId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`mt-1 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor={subjectInputId} className="block text-small font-medium text-ink-600">
              {t("admin_penalties_subject")}
            </label>
            <input
              id={subjectInputId}
              type="text"
              value={draftSubject}
              onChange={(e) => setDraftSubject(e.target.value)}
              className={`mt-1 w-full min-h-[44px] max-w-md ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_penalties_subject_ph")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor={reportIdInputId} className="block text-small font-medium text-ink-600">
              {t("admin_penalties_reportId")}
            </label>
            <input
              id={reportIdInputId}
              type="text"
              value={draftReportId}
              onChange={(e) => setDraftReportId(e.target.value)}
              className={`mt-1 w-full min-h-[44px] max-w-md ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_penalties_reportId_ph")}
              autoComplete="off"
            />
          </div>
          <div className="min-w-[10rem]">
            <label htmlFor={statusSelectId} className="block text-small font-medium text-ink-600">
              {t("admin_penalties_status")}
            </label>
            <select
              id={statusSelectId}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1.5 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {penaltyStatusOptions.map((v) => (
                <option key={v || "all"} value={v}>
                  {v === "" ? t("admin_penalties_statusAll") : v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
      <div className={ADMIN_FILTER_ACTIONS_CLASS}>
        <button
          form="admin-penalties-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
        >
          {t("admin_penalties_apply")}
        </button>
        {hasActiveFilters ? (
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              resetFilters();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_penalties_filter_clear")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
