"use client";

/**
 * /admin/guides · Guide directory · tip shell + V65 Batch3 Cut B R034/R035/R037/R054 markers.
 * Keep AdminListPageChrome / LocaleProvider / useAdminGuidesPage — do not invent shells.
 */

import Link from "next/link";
import { useId, useMemo, type CSSProperties } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import {
  AdminEnterpriseHardeningRoot,
  AdminEnterpriseLifecycleBadge,
  AdminEnterpriseTipHonestyStrip,
} from "@/components/admin/AdminEnterpriseHonestyChrome";
import { AdminEnterpriseListVirtualBody } from "@/components/admin/AdminEnterpriseListVirtual";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminOpsLeafDataSourceStrip } from "@/components/admin/AdminOpsLeafDataSourceStrip";
import { AdminGuidesTriangleStrip } from "@/components/admin/AdminGuidesTriangleStrip";
import { AdminGuidesInventoryStrip } from "@/components/admin/AdminGuidesInventoryStrip";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { ADMIN_EMPTY_NEXT_GUIDES_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
import { GUIDES_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminOpsListRelatedFoldLinks";
import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";
import { guideDirectoryStatusLabelKey } from "@/lib/admin/adminGuidesLabels";
import {
  ADMIN_ENTERPRISE_HARDENING_MARKERS as M,
  ADMIN_GUIDES_STATUS_SELECT_OPTIONS,
  shouldVirtualizeAdminEnterpriseList,
} from "@/lib/admin/adminEnterpriseHardeningContract";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { shortEvmAddress } from "@/lib/formatEvmAddress";
import { shortAdminId } from "@/lib/admin/shortAdminId";
import { useAdminGuidesPage } from "./useAdminGuidesPage";
import {
  ADMIN_GUIDES_CITY_MAX,
  ADMIN_GUIDES_COUNTRY_MAX,
  ADMIN_GUIDES_Q_MAX,
  type AdminGuideRow,
} from "./adminGuidesPageModel";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_PRIMARY_ACTION_BTN_CLASS,
  ADMIN_STATUS_NEUTRAL_BADGE_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  ADMIN_TABLE_TD_CELL_CLASS,
  ADMIN_TABLE_TD_MONO_CLASS,
  ADMIN_TABLE_TD_TIMESTAMP_CLASS,
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
  ADMIN_FILTER_TITLE_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";

type GuideSortKey = "status" | "updated_at" | "city";

const VIRTUAL_ROW_GRID =
  "grid grid-cols-[minmax(5rem,1fr)_minmax(5rem,1fr)_minmax(4rem,0.8fr)_minmax(3rem,0.6fr)_minmax(5rem,1fr)_minmax(4rem,0.7fr)_minmax(5rem,0.9fr)_minmax(4rem,0.7fr)_minmax(6rem,1fr)_minmax(5rem,0.9fr)_minmax(4rem,0.7fr)] gap-2 border-b border-slate-100 px-3 py-2 text-sm";

function GuideVirtualRow({
  row,
  t,
  style,
}: {
  row: AdminGuideRow;
  t: (k: string, vars?: Record<string, string>) => string;
  style?: CSSProperties;
}) {
  const w = row.wallet_address?.trim();
  const hasDocs = !!(
    row.id_photo_url?.trim() ||
    row.language_cert_url?.trim() ||
    row.guide_license_url?.trim()
  );
  return (
    <div className={VIRTUAL_ROW_GRID} style={style} role="row">
      <span className={ADMIN_TABLE_TD_MONO_CLASS} title={row.id}>
        {shortAdminId(row.id)}
      </span>
      <span className={ADMIN_TABLE_TD_MONO_CLASS} title={row.user_id ?? undefined}>
        {shortAdminId(row.user_id) || t("admin_em_dash")}
      </span>
      <span>{row.city ?? t("admin_em_dash")}</span>
      <span>{row.country_code ?? t("admin_em_dash")}</span>
      <span className="whitespace-nowrap">
        {row.status ? (
          <span className={ADMIN_STATUS_NEUTRAL_BADGE_CLASS}>
            {t(guideDirectoryStatusLabelKey(row.status))}
          </span>
        ) : (
          t("admin_em_dash")
        )}
      </span>
      <span className="tabular-nums">{row.stake_amount ?? t("admin_em_dash")}</span>
      <span className={ADMIN_TABLE_TD_MONO_CLASS}>{w ? shortEvmAddress(w) : t("admin_em_dash")}</span>
      <span className={ADMIN_TEXT_META_CLASS}>
        {hasDocs ? t("admin_guides_docsPresent") : t("admin_guides_docsMissing")}
      </span>
      <span className={ADMIN_TABLE_TD_TIMESTAMP_CLASS}>{row.updated_at ?? t("admin_em_dash")}</span>
      <span className="whitespace-nowrap">
        <Link
          href={`/admin/guides/${encodeURIComponent(row.id)}`}
          className={adminTableRowPrimaryActionClass()}
          aria-label={t("admin_guides_detail_row_aria", { id: row.id })}
        >
          {t("admin_ops_guideDetailAdmin")}
        </Link>
      </span>
      <span className="whitespace-nowrap">
        <Link
          href={`/guides/${encodeURIComponent(row.id)}`}
          className={adminTableRowSecondaryActionClass()}
          aria-label={t("admin_guides_public_row_aria", { id: row.id })}
        >
          {t("admin_guides_linkPublic")}
        </Link>
      </span>
    </div>
  );
}

/** 70：向导入驻台账（GET /api/v1/admin/guides）· Cut B enterprise hardening */
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
    total,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    draftCity,
    setDraftCity,
    draftCountry,
    setDraftCountry,
    draftQ,
    setDraftQ,
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

  const useVirtual = shouldVirtualizeAdminEnterpriseList(sortedItems.length);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_guides_directory_title")}
      subtitle={t("admin_guides_subtitle_l5")}
    >
      <AdminEnterpriseHardeningRoot className="space-y-4">
        <AdminOpsDetailRelatedFold
          relatedLinks={GUIDES_LIST_RELATED_FOLD_LINKS}
          ariaLabelKey="admin_ops_list_related_aria"
          foldSummaryKey="admin_ops_list_related_fold"
          dataTtFold="guides-list"
        />
        <AdminGuidesTriangleStrip current="directory" />
        <AdminGuidesInventoryStrip
          loadedCount={items.length}
          apiTotal={total}
          loading={loading && items.length === 0}
        />
        <AdminOpsLeafDataSourceStrip leaf="guides" meta={meta} />
        <div className="flex flex-wrap items-center gap-2">
          <AdminEnterpriseLifecycleBadge tone="ACTIVE" />
          <AdminEnterpriseTipHonestyStrip kind="product_fe" />
        </div>
        <div
          className={`mt-6 ${ADMIN_FILTER_CARD_CLASS}`}
          {...{ [M.guidesFilterBar]: "1" }}
        >
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
                {t("admin_guides_q_label")}
                <input
                  className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  type="search"
                  value={draftQ}
                  maxLength={ADMIN_GUIDES_Q_MAX}
                  onChange={(e) => setDraftQ(e.target.value)}
                  aria-label={t("admin_guides_q_label")}
                  data-tt-admin-guides-q="1"
                />
              </label>
              <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
                {t("admin_guides_city_filter_label")}
                <input
                  className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  type="text"
                  value={draftCity}
                  maxLength={ADMIN_GUIDES_CITY_MAX}
                  onChange={(e) => setDraftCity(e.target.value)}
                  aria-label={t("admin_guides_city_filter_label")}
                  data-tt-admin-guides-city="1"
                />
              </label>
              <label className={ADMIN_FILTER_FIELD_LABEL_CLASS}>
                {t("admin_guides_country_filter_label")}
                <input
                  className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  type="text"
                  value={draftCountry}
                  maxLength={ADMIN_GUIDES_COUNTRY_MAX}
                  onChange={(e) => setDraftCountry(e.target.value)}
                  aria-label={t("admin_guides_country_filter_label")}
                  data-tt-admin-guides-country="1"
                />
              </label>
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
                <select
                  {...{ [M.guidesStatusSelect]: "1" }}
                  className={`mt-1 w-full min-h-[44px] ${ADMIN_FILTER_INPUT_MD_CLASS} px-3 py-2 text-ink-800 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  aria-label={t("admin_guides_status_filter_label")}
                >
                  {ADMIN_GUIDES_STATUS_SELECT_OPTIONS.map((opt) => (
                    <option key={opt || "all"} value={opt}>
                      {opt === "" ? t("admin_guides_status_all") : t(guideDirectoryStatusLabelKey(opt))}
                    </option>
                  ))}
                </select>
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

        {error ? (
          <AdminListFetchError
            errorKind={error}
            errorKey={error}
            message={adminErrorUserText(error, t)}
          />
        ) : null}

        {!loading && !error && appliedFilters && (
          <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card">
            {t("admin_guides_applied")} {formatAdminAppliedFiltersHuman(appliedFilters, t)}
          </AdminAppliedFiltersBanner>
        )}

        {!loading && !error && items.length === 0 ? (
          <AdminListPageEmptyState
            messageKey="admin_guides_empty"
            nextLinks={ADMIN_EMPTY_NEXT_GUIDES_EMPTY}
            filteredEmpty={Boolean(appliedFilters)}
          />
        ) : null}

        {!loading && items.length > 0 && (
          <section
            {...{ [M.guidesTableChrome]: "1" }}
            {...{ [M.guidesTableNowrap]: "1" }}
            className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            aria-label={t("admin_guides_table_aria")}
            data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
          >
            {useVirtual ? (
              <div className="min-w-[64rem]">
                <div
                  className={`${VIRTUAL_ROW_GRID} bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500`}
                  role="row"
                >
                  <span>{t("admin_guides_colGuideId")}</span>
                  <span>{t("admin_guides_colUserId")}</span>
                  <span>{t("admin_guides_colCity")}</span>
                  <span>{t("admin_guides_colCountry")}</span>
                  <span>{t("admin_guides_colStatus")}</span>
                  <span>{t("admin_guides_colStake")}</span>
                  <span>{t("admin_guides_colWallet")}</span>
                  <span>{t("admin_guides_colDocs")}</span>
                  <span>{t("admin_guides_colUpdated")}</span>
                  <span>{t("admin_guides_colOps")}</span>
                  <span>{t("admin_guides_linkPublic")}</span>
                </div>
                <AdminEnterpriseListVirtualBody
                  items={sortedItems}
                  getKey={(row) => row.id}
                  renderRow={({ item: row, style }) => (
                    <GuideVirtualRow row={row} t={t} style={style} />
                  )}
                />
              </div>
            ) : (
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
                <tbody
                  className={`${ADMIN_TABLE_DIVIDE_CLASS} text-slate-200`}
                  {...{ [M.listVirtual]: "0" }}
                  {...{ [M.listVirtualCount]: String(sortedItems.length) }}
                >
                  {sortedItems.map((row) => {
                    const w = row.wallet_address?.trim();
                    const hasDocs = !!(
                      row.id_photo_url?.trim() ||
                      row.language_cert_url?.trim() ||
                      row.guide_license_url?.trim()
                    );
                    return (
                      <tr key={row.id} className={ADMIN_TABLE_ROW_CLASS}>
                        <td className={`px-4 py-2 ${ADMIN_TABLE_TD_MONO_CLASS}`} title={row.id}>
                          {shortAdminId(row.id)}
                        </td>
                        <td
                          className={`px-4 py-2 ${ADMIN_TABLE_TD_MONO_CLASS}`}
                          title={row.user_id ?? undefined}
                        >
                          {shortAdminId(row.user_id) || t("admin_em_dash")}
                        </td>
                        <td className={ADMIN_TABLE_TD_CELL_CLASS}>{row.city ?? t("admin_em_dash")}</td>
                        <td className={ADMIN_TABLE_TD_CELL_CLASS}>
                          {row.country_code ?? t("admin_em_dash")}
                        </td>
                        <td className={`${ADMIN_TABLE_TD_CELL_CLASS} whitespace-nowrap`}>
                          {row.status ? (
                            <span className={ADMIN_STATUS_NEUTRAL_BADGE_CLASS}>
                              {t(guideDirectoryStatusLabelKey(row.status))}
                            </span>
                          ) : (
                            t("admin_em_dash")
                          )}
                        </td>
                        <td className={`${ADMIN_TABLE_TD_CELL_CLASS} tabular-nums`}>
                          {row.stake_amount ?? t("admin_em_dash")}
                        </td>
                        <td className={`px-4 py-2 ${ADMIN_TABLE_TD_MONO_CLASS}`}>
                          {w ? shortEvmAddress(w) : t("admin_em_dash")}
                        </td>
                        <td className={`px-4 py-2 ${ADMIN_TEXT_META_CLASS}`}>
                          {hasDocs ? t("admin_guides_docsPresent") : t("admin_guides_docsMissing")}
                        </td>
                        <td className={`px-4 py-2 ${ADMIN_TABLE_TD_TIMESTAMP_CLASS}`}>
                          {row.updated_at ?? t("admin_em_dash")}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/admin/guides/${encodeURIComponent(row.id)}`}
                            className={adminTableRowPrimaryActionClass()}
                            aria-label={t("admin_guides_detail_row_aria", { id: row.id })}
                          >
                            {t("admin_ops_guideDetailAdmin")}
                          </Link>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
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
            )}
          </section>
        )}
      </AdminEnterpriseHardeningRoot>
    </AdminListPageChrome>
  );
}
