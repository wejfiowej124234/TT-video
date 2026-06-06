"use client";

import { formatAdminAppliedFiltersHuman } from "@/lib/admin/formatAdminAppliedFiltersHuman";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { financePeerRelatedFoldLinks } from "@/lib/admin/adminFinanceRelatedFoldLinks";
import { shortHex } from "./adminRegionVaultPageModel";
import { useAdminRegionVaultPage } from "./useAdminRegionVaultPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  adminHubKpiLinkClass,
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_SCROLL_SECTION_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_TABLE_DIVIDE_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";

type RegionVaultSortKey = "chain_id" | "block_number";
export function AdminRegionVaultPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const regionVaultLoadMoreFilterHintId = useId();
  const {
    loading,
    refreshing,
    loadingMore,
    error,
    summary,
    items,
    nextCursor,
    hasMore,
    meta,
    appliedFilters,
    onLoadMore,
  } = useAdminRegionVaultPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<RegionVaultSortKey>("block_number", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "block_number") return Number(row.block_number) || 0;
        return Number(row.chain_id) || 0;
      }),
    [items, sort.key, sort.dir],
  );

  const appliedFiltersKey = appliedFilters == null ? "none" : JSON.stringify(appliedFilters);

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_region_vault_title")}
      subtitle={t("admin_region_vault_subtitle_l5")}
      headerAside={<AdminFinanceSectionBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={financePeerRelatedFoldLinks("/admin/region-vault")}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="region-vault"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        regionVault={{
          total: summary?.total ?? null,
          minBlock: summary?.min_block_number ?? null,
          maxBlock: summary?.max_block_number ?? null,
          latestInserted: summary?.latest_inserted_at ?? null,
          loading,
          error: Boolean(error),
        }}
      />

      {loading && items.length === 0 && !summary ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!error && (!loading || summary) && summary && (
        <section
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t("admin_region_vault_summary_aria")}
          aria-describedby={
            [appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ") || undefined
          }
        >
          <Link
            href="#admin-region-vault-events"
            className={adminHubKpiLinkClass()}
            data-tt-admin-hub-kpi-link="1"
          >
            <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
              <h2 className="text-body font-medium text-ink-800">{t("admin_region_vault_summaryTotal")}</h2>
              <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.total ?? 0}</p>
            </span>
          </Link>
          <Link
            href="#admin-region-vault-events"
            className={adminHubKpiLinkClass()}
            data-tt-admin-hub-kpi-link="1"
          >
            <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
              <h2 className="text-body font-medium text-ink-800">{t("admin_region_vault_blockRange")}</h2>
              <p className="mt-2 font-mono text-small text-ink-700">
                {summary.min_block_number ?? t("admin_em_dash")} →{" "}
                {summary.max_block_number ?? t("admin_em_dash")}
              </p>
            </span>
          </Link>
          <Link
            href="#admin-region-vault-events"
            className={`${adminHubKpiLinkClass()} sm:col-span-2`}
            data-tt-admin-hub-kpi-link="1"
          >
            <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
              <h2 className="text-body font-medium text-ink-800">{t("admin_region_vault_latestInserted")}</h2>
              <p className="mt-2 font-mono text-small text-ink-700">
                {summary.latest_inserted_at ?? t("admin_em_dash")}
              </p>
            </span>
          </Link>
        </section>
      )}

      {!error && appliedFilters && (!loading || items.length > 0) ? (
        <AdminAppliedFiltersBanner
          key={appliedFiltersKey}
          id={adminAppliedFiltersDescId}
          variant="card"
          className="mt-6"
        >
          {t("admin_region_vault_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {!error && (!loading || items.length > 0) && items.length > 0 && (
        <section
          id="admin-region-vault-events"
          className={`${ADMIN_TABLE_SCROLL_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_region_vault_events_table_aria")}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <table className={`min-w-full ${ADMIN_TABLE_DIVIDE_CLASS} text-left text-small`}>
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_region_vault_colChain")}
                  ariaSort={ariaSort("chain_id")}
                  onToggle={() => toggle("chain_id")}
                />
                <AdminSortableTh
                  label={t("admin_region_vault_colBlockLog")}
                  ariaSort={ariaSort("block_number")}
                  onToggle={() => toggle("block_number")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_region_vault_colTx")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_region_vault_colVault")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_region_vault_colToken")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_region_vault_colTo")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_region_vault_colAmount")}
                </th>
              </tr>
            </thead>
            <tbody className={`${ADMIN_TABLE_DIVIDE_CLASS} font-mono text-small text-ink-800 text-ink-800`}>
              {sortedItems.map((row) => (
                <tr key={row.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="whitespace-nowrap px-3 py-2">{row.chain_id}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.block_number}:{row.log_index}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.tx_hash}>
                    {shortHex(row.tx_hash)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.vault_address}>
                    {shortHex(row.vault_address)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.token_address}>
                    {shortHex(row.token_address)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.to_address}>
                    {shortHex(row.to_address)}
                  </td>
                  <td className="max-w-[6rem] truncate px-3 py-2" title={row.amount_u256_hex}>
                    {shortHex(row.amount_u256_hex, 4, 4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!error && (!loading || summary) && items.length === 0 && summary && (summary.total ?? 0) === 0 && (
        <AdminListPageEmptyState
          messageKey="admin_region_vault_empty"
          nextLinks={[
            { href: "/admin/finance-suite", labelKey: "admin_shell_nav_finance_suite" },
            { href: "/admin/indexer", labelKey: "admin_indexer_title" },
          ]}
        />
      )}

      {hasMore && nextCursor && (
        <div className="mt-6">
          <p id={regionVaultLoadMoreFilterHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
            {t("admin_region_vault_load_more_filter_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={[appliedFilters ? adminAppliedFiltersDescId : null, regionVaultLoadMoreFilterHintId]
              .filter(Boolean)
              .join(" ")}
            onSubmit={(e) => {
              e.preventDefault();
              onLoadMore();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
            >
              {loadingMore ? t("admin_region_vault_loadingMore") : t("admin_region_vault_loadMore")}
            </button>
          </form>
        </div>
      )}
    </AdminListPageChrome>
  );
}
