"use client";

import Link from "next/link";
import { useId, useMemo } from "react";
import { AdminSortableTh } from "@/components/admin/AdminSortableTh";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { shortHex } from "./adminFeeRouterPageModel";
import { useAdminFeeRouterPage } from "./useAdminFeeRouterPage";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import {
  ADMIN_FILTER_CARD_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";

type FeeRouterSortKey = "chain_id" | "block_number";
export function AdminFeeRouterPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const adminAppliedFiltersDescId = useId();
  const feeRouterLoadMoreFilterHintId = useId();
  const {
    loading,
    loadingMore,
    error,
    summary,
    items,
    nextCursor,
    hasMore,
    meta,
    appliedFilters,
    appliedFiltersKey,
    onLoadMore,
  } = useAdminFeeRouterPage();

  const { sort, toggle, ariaSort } = useAdminTableSort<FeeRouterSortKey>("block_number", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "block_number") return Number(row.block_number) || 0;
        return Number(row.chain_id) || 0;
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_fee_router_title")}
      subtitle={t("admin_fee_router_subtitle")}
      headerAside={
        <>
          <Link
            href="/admin/observability"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/finance"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_finance_title")}
          </Link>
          <Link
            href="/admin/region-vault"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_region_vault_title")}
          </Link>
          <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        feeRouter={{
          total: summary?.total ?? null,
          minBlock: summary?.min_block_number ?? null,
          maxBlock: summary?.max_block_number ?? null,
          latestInserted: summary?.latest_inserted_at ?? null,
          loading,
          error: Boolean(error),
        }}
      />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {!loading && !error && summary && (
        <section
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t("admin_fee_router_summary_aria")}
          aria-describedby={
            [appliedFilters ? adminAppliedFiltersDescId : ""].filter(Boolean).join(" ") || undefined
          }
        >
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_summaryTotal")}</h2>
            <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.total ?? 0}</p>
          </Link>
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_blockRange")}</h2>
            <p className="mt-2 font-mono text-small text-ink-700">
              {summary.min_block_number ?? t("admin_em_dash")} →{" "}
              {summary.max_block_number ?? t("admin_em_dash")}
            </p>
          </Link>
          <Link
            href="#admin-fee-router-events"
            className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition hover:border-ink-400 hover:text-ink-900 sm:col-span-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
          >
            <h2 className="text-body font-medium text-ink-800">{t("admin_fee_router_latestInserted")}</h2>
            <p className="mt-2 font-mono text-small text-ink-700">
              {summary.latest_inserted_at ?? t("admin_em_dash")}
            </p>
          </Link>
        </section>
      )}

      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner
          key={appliedFiltersKey}
          id={adminAppliedFiltersDescId}
          variant="card"
          className="mt-6"
        >
          {t("admin_fee_router_applied")}: {formatAdminAppliedFiltersHuman(appliedFilters, t)}
        </AdminAppliedFiltersBanner>
      ) : null}

      {!loading && !error && items.length > 0 && (
        <section
          id="admin-fee-router-events"
          className="mt-8 scroll-mt-24 overflow-x-auto rounded-[var(--radius-md)] border border-ink-200"
          aria-label={t("admin_fee_router_events_table_aria")}
        >
          <table className="min-w-full divide-y divide-ink-100 text-left text-small">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <AdminSortableTh
                  label={t("admin_fee_router_colChain")}
                  ariaSort={ariaSort("chain_id")}
                  onToggle={() => toggle("chain_id")}
                />
                <AdminSortableTh
                  label={t("admin_fee_router_colBlockLog")}
                  ariaSort={ariaSort("block_number")}
                  onToggle={() => toggle("block_number")}
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_fee_router_colTx")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_fee_router_colToken")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium`}>
                  {t("admin_fee_router_colAmount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 font-mono text-meta text-ink-800">
              {sortedItems.map((row) => (
                <tr key={row.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="whitespace-nowrap px-3 py-2">{row.chain_id}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.block_number}:{row.log_index}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.tx_hash}>
                    {shortHex(row.tx_hash)}
                  </td>
                  <td className="max-w-[7rem] truncate px-3 py-2" title={row.token_address}>
                    {shortHex(row.token_address)}
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

      {!loading && !error && items.length === 0 && summary && (summary.total ?? 0) === 0 && (
        <AdminListPageEmptyState
          messageKey="admin_fee_router_empty"
          nextLinks={[
            { href: "/admin/finance-suite", labelKey: "admin_shell_nav_finance_suite" },
            { href: "/admin/region-vault", labelKey: "admin_region_vault_title" },
          ]}
        />
      )}

      {hasMore && nextCursor && (
        <div className="mt-6">
          <p id={feeRouterLoadMoreFilterHintId} className="mb-2 max-w-2xl text-meta text-ink-600">
            {t("admin_fee_router_load_more_filter_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={[appliedFilters ? adminAppliedFiltersDescId : null, feeRouterLoadMoreFilterHintId]
              .filter(Boolean)
              .join(" ")}
            onSubmit={(e) => {
              e.preventDefault();
              onLoadMore();
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              disabled={loadingMore}
              aria-busy={loadingMore ? true : undefined}
            >
              {loadingMore ? t("admin_fee_router_loadingMore") : t("admin_fee_router_loadMore")}
            </button>
          </form>
        </div>
      )}
    </AdminListPageChrome>
  );
}
