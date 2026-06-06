"use client";

import { type FormEvent } from "react";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import {
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
} from "@/lib/adminUi";
import {
  RC_MAX,
  STATUS_OPTIONS,
  TT_MAX,
} from "./adminCommunityReportsTypes";

export type AdminCommunityReportsFilterIds = {
  adminListApplyResetHintId: string;
  adminAppliedFiltersDescId: string;
  communityReportsFilterLimitId: string;
  communityReportsFilterStatusId: string;
  communityReportsFilterReporterId: string;
  communityReportsFilterTargetTypeId: string;
  communityReportsFilterReasonCodeId: string;
  communityReportsFilterTargetId: string;
};

export function AdminCommunityReportsFilterCard({
  t,
  ids,
  loading,
  error,
  appliedFilters,
  draftLimit,
  setDraftLimit,
  draftStatus,
  setDraftStatus,
  draftReporterId,
  setDraftReporterId,
  draftTargetType,
  setDraftTargetType,
  draftReasonCode,
  setDraftReasonCode,
  draftTargetId,
  setDraftTargetId,
  apply,
  hasExtraFilters,
  resetExtraFilters,
}: {
  t: (k: string) => string;
  ids: AdminCommunityReportsFilterIds;
  loading: boolean;
  error: AdminFetchErrorKind | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftStatus: string;
  setDraftStatus: (v: string) => void;
  draftReporterId: string;
  setDraftReporterId: (v: string) => void;
  draftTargetType: string;
  setDraftTargetType: (v: string) => void;
  draftReasonCode: string;
  setDraftReasonCode: (v: string) => void;
  draftTargetId: string;
  setDraftTargetId: (v: string) => void;
  apply: (e?: FormEvent) => void;
  hasExtraFilters: boolean;
  resetExtraFilters: () => void;
}) {
  const { adminListApplyResetHintId, adminAppliedFiltersDescId, ...inputIds } = ids;
  return (
    <div className={`mt-5 ${ADMIN_FILTER_CARD_CLASS}`} data-tt-admin-reports-filter-grid="1">
      <form
        id="admin-community-reports-filter-form"
        aria-label={t("admin_community_reports_filters")}
        aria-describedby={
          [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
            .filter(Boolean)
            .join(" ")
        }
        onSubmit={apply}
      >
        <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_community_reports_filters")}</h2>
        <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
          {t("admin_list_filters_apply_reset_hint")}
        </p>
        <div className={ADMIN_FILTER_GRID_CLASS}>
          <label htmlFor={inputIds.communityReportsFilterLimitId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_limit")}
            <input
              id={inputIds.communityReportsFilterLimitId}
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`mt-1 block w-full max-w-[8rem] min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterStatusId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_status")}
            <select
              id={inputIds.communityReportsFilterStatusId}
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {STATUS_OPTIONS.map((v) => (
                <option key={v || "all"} value={v}>
                  {v === "" ? t("admin_community_reports_statusAll") : v}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={inputIds.communityReportsFilterReporterId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_reporter_id")}
            <input
              id={inputIds.communityReportsFilterReporterId}
              type="text"
              value={draftReporterId}
              onChange={(e) => setDraftReporterId(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_reporter_id_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterTargetTypeId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_target_type")}
            <input
              id={inputIds.communityReportsFilterTargetTypeId}
              type="text"
              value={draftTargetType}
              onChange={(e) => setDraftTargetType(e.target.value.slice(0, TT_MAX))}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_target_type_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterReasonCodeId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_reason_code")}
            <input
              id={inputIds.communityReportsFilterReasonCodeId}
              type="text"
              value={draftReasonCode}
              onChange={(e) => setDraftReasonCode(e.target.value.slice(0, RC_MAX))}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_reason_code_ph")}
              autoComplete="off"
            />
          </label>
          <label htmlFor={inputIds.communityReportsFilterTargetId} className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_community_reports_target_id")}
            <input
              id={inputIds.communityReportsFilterTargetId}
              type="text"
              value={draftTargetId}
              onChange={(e) => setDraftTargetId(e.target.value)}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_community_reports_target_id_ph")}
              autoComplete="off"
            />
          </label>
        </div>
      </form>
      <div className={ADMIN_FILTER_ACTIONS_CLASS}>
        <button
          form="admin-community-reports-filter-form"
          type="submit"
          className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
        >
          {t("admin_community_reports_apply")}
        </button>
        {hasExtraFilters ? (
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              resetExtraFilters();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_community_reports_clear_extra")}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
