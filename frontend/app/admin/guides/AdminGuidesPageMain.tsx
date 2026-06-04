"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { ADMIN_EMPTY_NEXT_GUIDES_EMPTY } from "@/lib/admin/adminListEmptyStateNextLinks";
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
  adminTableInlineLinkClass,
} from "@/lib/adminUi";

type GuideSortKey = "status" | "updated_at" | "city";

/** 70：向导入驻台账（GET /api/v1/admin/guides） */
export function AdminGuidesPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const adminListApplyResetHintId = useId();
  const {
    loading,
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
      subtitle={t("admin_guides_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
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
          <h2 className="text-body font-medium text-ink-800">{t("admin_guides_filters_title")}</h2>
          <p id={adminListApplyResetHintId} className="mt-2 text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-small text-ink-700">
              {t("admin_guides_limit_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                type="number"
                min={1}
                max={500}
                value={draftLimit}
                onChange={(e) => setDraftLimit(e.target.value)}
              />
            </label>
            <label className="text-small text-ink-700">
              {t("admin_guides_status_filter_label")}
              <input
                className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-2 font-mono text-meta ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
                placeholder={t("admin_guides_status_placeholder")}
              />
            </label>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
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
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-2 text-small font-medium text-ink-700 hover:bg-ink-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              type="submit"
            >
              {t("admin_guides_reset")}
            </button>
          </form>
        </div>
      </div>

      {loading ? (
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

      {!loading && !error && items.length > 0 && (
        <section
          className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-ink-200 bg-white"
          aria-label={t("admin_guides_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
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
            <tbody className="divide-y divide-ink-100 text-ink-800">
              {sortedItems.map((row) => {
                const w = row.wallet_address?.trim();
                const hasDocs =
                  !!(row.id_photo_url?.trim() || row.language_cert_url?.trim() || row.guide_license_url?.trim());
                return (
                  <tr key={row.id} className={ADMIN_TABLE_ROW_CLASS}>
                    <td className="px-4 py-2 font-mono text-meta">{row.id}</td>
                    <td className="px-4 py-2 font-mono text-meta">{row.user_id}</td>
                    <td className="px-4 py-2">{row.city ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.country_code ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2">{row.status ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 tabular-nums">{row.stake_amount ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-2 font-mono text-meta">{w ? shortEvmAddress(w) : t("admin_em_dash")}</td>
                    <td className="px-4 py-2 text-meta">
                      {hasDocs ? t("admin_guides_docsPresent") : t("admin_guides_docsMissing")}
                    </td>
                    <td className="px-4 py-2 text-meta whitespace-nowrap">{row.updated_at ?? t("admin_em_dash")}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/guides/${encodeURIComponent(row.id)}`}
                        className={`${adminTableInlineLinkClass()}`}
                        aria-label={t("admin_guides_detail_row_aria", { id: row.id })}
                      >
                        {t("admin_ops_guideDetailAdmin")}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/guides/${encodeURIComponent(row.id)}`}
                        className={adminTableInlineLinkClass()}
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
