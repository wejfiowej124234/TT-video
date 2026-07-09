"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_EMPTY_NEXT_GUIDES_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { GUIDES_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { useAdminGuidesPage } from "./useAdminGuidesPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  adminTableRowSecondaryActionClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_FILTER_INPUT_MD_CLASS,
  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_FILTER_ACTIONS_CLASS,
  ADMIN_FILTER_FIELD_LABEL_CLASS,
  ADMIN_FILTER_GRID_CLASS,
  ADMIN_FILTER_HINT_CLASS,
  ADMIN_FILTER_TITLE_CLASS} from "@/lib/adminUi";

type GuideSortKey = "status" | "updated_at" | "city";

/** 70：向导入驻台账（GET /api/v1/admin/guides） */
export function AdminGuidesPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const {
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    apply,
    reset,
  } = useAdminGuidesPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<GuideSortKey>("updated_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "updated_at") return row.updated_at ?? "";
        if (key === "city") return row.city ?? "";
        return row.status ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_guides_title")}
      subtitle={t("admin_guides_subtitle_l5")}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={GUIDES_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_ops_list_related_aria"
        foldSummaryKey="admin_ops_list_related_fold"
        dataTtFold="guides-list"
      />
      <div className={`mt-6 ${ADMIN_FILTER_CARD_CLASS}`}>
        <form
          id="admin-guides-filter-form"
          aria-label={t("admin_guides_filters_aria")}
          aria-describedby={
            [adminListApplyResetHintId, !loading && !error && appliedFilters ? adminAppliedFiltersDescId : ""]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={apply}
        >
          <h2 className={ADMIN_FILTER_TITLE_CLASS}>{t("admin_guides_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className={ADMIN_FILTER_HINT_CLASS}>
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className={ADMIN_FILTER_GRID_CLASS}>
            <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_guides_limit_label")}
              <input
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
              {t("admin_guides_status_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 font-mono text-small text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                placeholder={t("admin_guides_status_placeholder")}
              />
            </label>
          </div>
        </form>
        <div className={ADMIN_FILTER_ACTIONS_CLASS}>
          <button form="admin-guides-filter-form" className={ADMIN_PRIMARY_ACTION_BTN_CLASS} type="submit">
            {t("admin_guides_apply")}
          </button>
          <form
            className="inline"
            aria-describedby={adminListApplyResetHintId}
            onSubmit={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            <button
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="submit"
            >
              {t("admin_guides_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} /> : null}

      {!loading && !error && appliedFilters && (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
          {t("admin_guides_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      )}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && items.length === 0 ? (
        <AdminListPageEmptyState
          messageKey="admin_guides_empty"
          nextLinks={ADMIN_EMPTY_NEXT_GUIDES_EMPTY}
          filteredEmpty={Boolean(appliedFilters)}
        />
      ) : null}

      {!loading && items.length > 0 && (
        <section
          className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_guides_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colGuideId")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colUserId")}
                </th>
                <AdminSortableTh
                  label={t("admin_guides_colCity")}
                  ariaSort={ariaSort("city")}
                  onToggle={() => toggle("city")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colCountry")}
                </th>
                <AdminSortableTh
                  label={t("admin_guides_colStatus")}
                  ariaSort={ariaSort("status")}
                  onToggle={() => toggle("status")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_col_data_origin")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colStake")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colWallet")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colDocs")}
                </th>
                <AdminSortableTh
                  label={t("admin_guides_colUpdated")}
                  ariaSort={ariaSort("updated_at")}
                  onToggle={() => toggle("updated_at")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_colOps")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_guides_linkPublic")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} text-ink-800`}>
              {sortedItems.map((row) => {
                const w = row.wallet_address?.trim();
                const hasDocs =
                  !!(row.id_photo_url?.trim() || row.language_cert_url?.trim() || row.guide_license_url?.trim());
                return (
                  <tr key={row.id} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-4 py-2 font-mono text-small text-ink-800">{row.id}</td>
                    <td className="px-4 py-2 font-mono text-small text-ink-800">{row.user_id}</td>
                    <td className="px-4 py-2">{row.city ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.country_code ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.status ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 font-mono text-meta text-ink-700">{row.data_origin ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 tabular-nums">{row.stake_amount ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 font-mono text-small text-ink-800">{w ? shortEvmAddress(w) : t("admin_em_dash")}</td>
                    <td className="px-4 py-2 text-meta">
                      {hasDocs ? t("admin_guides_docsPresent") : t("admin_guides_docsMissing")}
                    </td>
                    <td className="px-4 py-2 text-meta whitespace-nowrap">{row.updated_at ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/guides/${encodeURIComponent(row.id)}`}
                        className={adminTableRowPrimaryActionClass()}
                        aria-label={t("admin_guides_detail_row_aria", { id: row.id })}
                      >
                        {t("admin_ops_guideDetailAdmin")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/guides/${encodeURIComponent(row.id)}`}
                        className={adminTableRowSecondaryActionClass()}
                        aria-label={t("admin_guides_public_row_aria", { id: row.id })}
                      >
                        {t("admin_guides_linkPublic")}
                      </Link>
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
