"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminCommunityListHeaderAside } from "@/components/admin/AdminCommunityListHeaderAside";
import { AdminCommunityRelatedLinks } from "@/components/admin/AdminCommunityRelatedLinks";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_COMMUNITY_MOD_CASES_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  ADMIN_MOD_CASES_STATUS_AFTER_MAX,
  ADMIN_MOD_CASES_STATUS_BEFORE_MAX,
  truncAdminModCaseText,
} from "./adminModerationCasesPageModel";
import type { AdminModerationCasesPageViewModel } from "./useAdminModerationCasesPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";

type ModCaseSortKey = "created_at" | "status_before" | "status_after";
type Props = AdminModerationCasesPageViewModel;

export function AdminCommunityModerationCasesPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();

  const {
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftReportId,
    setDraftReportId,
    draftActorId,
    setDraftActorId,
    draftStatusBefore,
    setDraftStatusBefore,
    draftStatusAfter,
    setDraftStatusAfter,
    apply,
    clearNonLimitFilters,
    hasExtraFilters,
  } = props;

  const { sort, toggle, ariaSort } = useAdminTableSort<ModCaseSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "status_after") return r.status_after ?? "";
        return r.status_before ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_mod_cases_title")}
      subtitle={t("admin_mod_cases_subtitle_l5")}
      headerAside={
        <AdminCommunityListHeaderAside>
      <AdminCommunityRelatedLinks />

          <Link href="/admin/community/reports" className={`${adminPageNavLinkClass()}`}>
            {t("admin_mod_cases_backReports")}
          </Link></AdminCommunityListHeaderAside>
      }
    >
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
        <form
          id="admin-mod-cases-filter-form"
          className="space-y-3"
          aria-label={t("admin_mod_cases_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
        <p className="text-small font-medium text-ink-800">{t("admin_mod_cases_filters")}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
            {t("admin_mod_cases_limit")}
            <input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(e.target.value)}
              className={`ml-2 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            />
          </label>
          <label className={`${ADMIN_FILTER_FIELD_LABEL_CLASS} min-w-[10rem] flex-1`}>
            {t("admin_mod_cases_reportId")}
            <input
              type="text"
              value={draftReportId}
              onChange={(e) => setDraftReportId(e.target.value)}
              className={`ml-2 w-full max-w-md min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_mod_cases_reportIdPh")}
              autoComplete="off"
            />
          </label>
          <label className={`${ADMIN_FILTER_FIELD_LABEL_CLASS} min-w-[10rem] flex-1`}>
            {t("admin_mod_cases_actorId")}
            <input
              type="text"
              value={draftActorId}
              onChange={(e) => setDraftActorId(e.target.value)}
              className={`ml-2 w-full max-w-md min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_mod_cases_actorIdPh")}
              autoComplete="off"
            />
          </label>
          <label className={`${ADMIN_FILTER_FIELD_LABEL_CLASS} min-w-[8rem] flex-1`}>
            {t("admin_mod_cases_statusBefore")}
            <input
              type="text"
              value={draftStatusBefore}
              onChange={(e) => setDraftStatusBefore(e.target.value.slice(0, ADMIN_MOD_CASES_STATUS_BEFORE_MAX))}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_mod_cases_statusBeforePh")}
              autoComplete="off"
            />
          </label>
          <label className={`${ADMIN_FILTER_FIELD_LABEL_CLASS} min-w-[8rem] flex-1`}>
            {t("admin_mod_cases_statusAfter")}
            <input
              type="text"
              value={draftStatusAfter}
              onChange={(e) => setDraftStatusAfter(e.target.value.slice(0, ADMIN_MOD_CASES_STATUS_AFTER_MAX))}
              className={`mt-1 block w-full min-h-[44px] ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              placeholder={t("admin_mod_cases_statusAfterPh")}
              autoComplete="off"
            />
          </label>
        </div>
        </form>
        <div className="flex flex-wrap gap-2">
          <button
            form="admin-mod-cases-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS}`}
          >
            {t("admin_mod_cases_apply")}
          </button>
          {hasExtraFilters ? (
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
                className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {t("admin_mod_cases_clear_extra")}
              </button>
            </form>
          ) : null}
        </div>
        {appliedFilters ? (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
            {t("admin_mod_cases_applied")}
            {t("market_fin_colon")}
            {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          </AdminAppliedFiltersBanner>
        ) : null}
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_mod_cases_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_mod_cases_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_MOD_CASES_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_mod_cases_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_mod_cases_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_mod_cases_colReport")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_mod_cases_colActor")}
                </th>
                <AdminSortableTh
                  label={t("admin_mod_cases_colBefore")}
                  ariaSort={ariaSort("status_before")}
                  onToggle={() => toggle("status_before")}
                />
                <AdminSortableTh
                  label={t("admin_mod_cases_colAfter")}
                  ariaSort={ariaSort("status_after")}
                  onToggle={() => toggle("status_after")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_mod_cases_colNotes")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_mod_cases_colPenalty")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((r, idx) => {
                const dash = t("admin_em_dash");
                return (
                  <tr key={r.id ?? `mc-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">{r.created_at ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[9rem] truncate" title={r.report_id}>
                      {r.report_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[9rem] truncate" title={r.actor_id}>
                      {r.actor_id ?? dash}
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status_before ?? dash}</td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status_after ?? dash}</td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="block truncate" title={r.admin_notes_snapshot ?? ""}>
                        {truncAdminModCaseText(r.admin_notes_snapshot, 120, dash)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[8rem] truncate" title={r.penalty_id ?? ""}>
                      {r.penalty_id ?? dash}
                    </td>
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
