"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminCommunityListHeaderAside } from "@/components/admin/AdminCommunityListHeaderAside";
import { AdminCommunityRelatedLinks } from "@/components/admin/AdminCommunityRelatedLinks";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { APPEAL_STATUS, bodyPreview } from "./adminCommunityAppealsPageModel";
import { useAdminCommunityAppealsPage } from "./useAdminCommunityAppealsPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  ADMIN_FILTER_INPUT_SM_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_HINT_CLASS} from "@/lib/adminUi";

type AppealSortKey = "status" | "created_at" | "reviewed_at";
export function AdminCommunityAppealsPageMain() {
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
    draftStatus,
    setDraftStatus,
    apply,
    resetFilters,
  } = useAdminCommunityAppealsPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<AppealSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (r, key) => {
        if (key === "created_at") return r.created_at ?? "";
        if (key === "reviewed_at") return r.reviewed_at ?? "";
        return r.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_appeals_title")}
      subtitle={
        <>
          <span>{t("admin_appeals_subtitle_l5")}</span>
          <AdminCommunityRelatedLinks />
        </>
      }
      headerAside={
        <AdminCommunityListHeaderAside>
          <Link href="/admin/community/appeals/review" className={`${adminPageNavLinkClass()}`}>
            {t("admin_appeals_linkReview")}
          </Link>
          <Link href="/admin/community/reports" className={`${adminPageNavLinkClass()}`}>
            {t("admin_penalties_linkReports")}
          </Link></AdminCommunityListHeaderAside>
      }
    >
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS} space-y-3`}>
        <form
          id="admin-appeals-filter-form"
          aria-label={t("admin_appeals_filters")}
          aria-describedby={
            [adminListApplyResetHintId, appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ")
          }
          onSubmit={apply}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_appeals_filters")}</p>
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_appeals_limit")}
              <input
                type="text"
                inputMode="numeric"
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
                className={`ml-2 min-h-[44px] w-20 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              />
            </label>
            <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_appeals_reportId")}
              <input
                type="text"
                value={draftReportId}
                onChange={(e) => setDraftReportId(e.target.value)}
                className={`ml-2 min-h-[44px] w-44 ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                placeholder={t("admin_appeals_reportId_ph")}
                autoComplete="off"
              />
            </label>
            <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_appeals_status")}
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                className={`ml-2 inline-flex min-h-[44px] items-center justify-start ${ADMIN_FILTER_INPUT_SM_CLASS} px-2 py-1 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              >
                {APPEAL_STATUS.map((v) => (
                  <option key={v || "all"} value={v}>
                    {v === "" ? t("admin_appeals_statusAll") : v}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {appliedFilters ? (
            <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="inline">
              {t("admin_appeals_applied")}
              {t("market_fin_colon")}
              {formatAdminAppliedFiltersHuman(appliedFilters, t)}
            </AdminAppliedFiltersBanner>
          ) : null}
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <button
            form="admin-appeals-filter-form"
            type="submit"
            className={`${ADMIN_PRIMARY_ACTION_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            {t("admin_appeals_apply")}
          </button>
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
              className={`${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
            >
              {t("admin_appeals_reset")}
            </button>
          </form>
        </div>
      </div>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {meta?.note ? (
        <AdminMetaNoteLink className="mt-3">{String(meta.note)}</AdminMetaNoteLink>
      ) : null}

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_appeals_loading")} />
      ) : null}
      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_appeals_empty"
          nextLinks={ADMIN_EMPTY_NEXT_COMMUNITY_APPEALS_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_appeals_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_appeals_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_appeals_colReport")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_appeals_colAppellant")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_appeals_colBody")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>v</th>
                <AdminSortableTh
                  label={t("admin_appeals_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                />
                <AdminSortableTh
                  label={t("admin_appeals_colReviewed")}
                  ariaSort={ariaSort("reviewed_at")}
                  onToggle={() => toggle("reviewed_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_appeals_colReview")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-700`}>
              {sortedItems.map((r, idx) => {
                const id = r.id?.trim();
                const ver = r.version;
                const reviewHref =
                  id != null && ver != null
                    ? `/admin/community/appeals/review?appeal_id=${encodeURIComponent(id)}&expected_version=${encodeURIComponent(String(ver))}`
                    : null;
                return (
                  <tr key={id ?? `ap-${idx}`} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">{r.status ?? t("admin_em_dash")}</td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[8rem] truncate" title={r.report_id}>
                      {r.report_id ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800 max-w-[8rem] truncate" title={r.appellant_id}>
                      {r.appellant_id ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="block truncate" title={r.body}>
                        {bodyPreview(r.body, t("admin_em_dash"))}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-small text-ink-800">{r.version ?? t("admin_em_dash")}</td>
                    <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">
                      {r.created_at ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2 font-mono text-meta text-ink-500 whitespace-nowrap">
                      {r.reviewed_at ?? t("admin_em_dash")}
                    </td>
                    <td className="px-3 py-2">
                      {reviewHref && r.status === "pending" ? (
                        <Link
                          href={reviewHref}
                          className={adminTableRowPrimaryActionClass()}
                          aria-label={t("admin_appeals_review_row_aria", { id: String(id ?? "") })}
                        >
                          {t("admin_appeals_rowReview")}
                        </Link>
                      ) : (
                        t("admin_em_dash")
                      )}
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
