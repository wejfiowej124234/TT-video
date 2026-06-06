"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminSortableTh } from "@/components/admin/AdminSortableTh";
import { sortRowsByKey, useAdminTableSort } from "@/lib/admin/useAdminTableSort";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  formatEconomicProjectionOneLine,
  formatEventLogEscrowCoverageOneLine,
  formatStatsBreakdownOneLine,
} from "./reconcileReportsPageModel";
import type { ReconcileReportRow } from "./reconcileReportsPageModel";
import {
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  ADMIN_TABLE_THEAD_CLASS,
  ADMIN_TABLE_TH_CELL_CLASS,
  adminPageNavLinkClass,
  adminTableRowPrimaryActionClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_PAGINATION_DISABLED_CLASS,
  ADMIN_TABLE_ROW_DIVIDER_CLASS,
  ADMIN_FORM_CONTROL_SM_CLASS,

  ADMIN_TABLE_SECTION_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";

type ReconcileSortKey = "created_at" | "issues_total";
import {
  formatReconcileReportCreatedAt,
  reconcileReportBreakdownTitle,
  reconcileReportCleanCellText,
  reconcileReportEconomicProjectionTitle,
  reconcileReportEventLogEscrowTitle,
} from "./reconcileReportsTableFormatters";
import type { LocaleTranslateFn } from "@/lib/i18n";

export function ReconcileReportsTableSection(props: {
  t: LocaleTranslateFn;
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  items: ReconcileReportRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rangeFrom: number;
  rangeTo: number;
  limitOptions: number[];
  listQuery: (nextPage: number, nextLimit: number) => string;
  onPerPageLimitChange: (nextLimit: number) => void;
}) {
  const {
    t,
    loading,
    refreshing,
    error,
    items,
    total,
    page,
    limit,
    totalPages,
    rangeFrom,
    rangeTo,
    limitOptions,
    listQuery,
    onPerPageLimitChange,
  } = props;

  const { sort, toggle, ariaSort } = useAdminTableSort<ReconcileSortKey>("created_at", "desc");
  const sortedItems = useMemo(
    () =>
      sortRowsByKey(items, sort.key, sort.dir, (row, key) => {
        if (key === "issues_total") return row.issues_total ?? 0;
        return row.created_at ?? "";
      }),
    [items, sort.key, sort.dir],
  );

  return (
    <>
      <section
        className={`${ADMIN_TABLE_SECTION_CLASS}${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
        aria-label={t("admin_indexer_reconcile_reports_page_aria")}
        data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
      >
        {loading && items.length === 0 ? (
          <AdminListLoadingStatus message={t("admin_indexer_reconcile_reports_loading")} className="p-4 text-body text-ink-600" />
        ) : error ? (
          <div className="p-4">
            <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
          </div>
        ) : items.length === 0 && total === 0 ? (
          <AdminListPageEmptyState
            messageKey="admin_indexer_reconcile_reports_empty"
            nextLinks={[
              { href: "/admin/finance-reconciliation", labelKey: "admin_shell_nav_finance_reconciliation" },
              { href: "/admin/indexer", labelKey: "admin_indexer_title" },
            ]}
          />
        ) : items.length === 0 && total > 0 ? (
          <div className="p-4 text-body text-ink-700" role="status">
            <p>{t("admin_indexer_reconcile_reports_empty_page")}</p>
            <Link
              href={listQuery(1, limit)}
              className={`mt-2 ${adminPageNavLinkClass()} rounded-[var(--radius-sm)]`}
            >
              {t("admin_indexer_reconcile_reports_first_page")}
            </Link>
          </div>
        ) : (
          <table className="min-w-full border-collapse text-left text-body">
            <thead className={ADMIN_TABLE_THEAD_CLASS}>
              <tr>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colId")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colType")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colChain")}
                </th>
                <AdminSortableTh
                  label={t("admin_indexer_reconcile_reports_colIssues")}
                  ariaSort={ariaSort("issues_total")}
                  onToggle={() => toggle("issues_total")}
                  className="uppercase tracking-wide text-ink-500"
                />
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colClean")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colBreakdown")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colEcon")}
                </th>
                <th scope="col" className={`${ADMIN_TABLE_TH_CELL_CLASS} font-medium uppercase tracking-wide text-ink-500`}>
                  {t("admin_indexer_reconcile_reports_colEventLogEscrow")}
                </th>
                <AdminSortableTh
                  label={t("admin_indexer_reconcile_reports_colCreated")}
                  ariaSort={ariaSort("created_at")}
                  onToggle={() => toggle("created_at")}
                  className="uppercase tracking-wide text-ink-500"
                />
                <th scope="col" className={ADMIN_TABLE_TH_CELL_CLASS} />
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((row) => (
                <tr key={row.id} className={`${ADMIN_TABLE_ROW_DIVIDER_CLASS} ${ADMIN_TABLE_ROW_CLASS}`}>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-mono text-small text-ink-800 text-ink-800" title={row.id}>
                    {row.id}
                  </td>
                  <td className="px-3 py-2 text-ink-800">{row.report_type}</td>
                  <td className="px-3 py-2 font-mono text-small text-ink-800 text-ink-700">
                    {row.chain_id != null ? String(row.chain_id) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-small text-ink-800 text-ink-800">
                    {row.issues_total != null ? String(row.issues_total) : "—"}
                  </td>
                  <td className="px-3 py-2 text-meta text-ink-700">{reconcileReportCleanCellText(row, t)}</td>
                  <td
                    className="max-w-[18rem] truncate px-3 py-2 font-mono text-small text-ink-800 text-ink-700"
                    title={reconcileReportBreakdownTitle(row, t)}
                  >
                    {formatStatsBreakdownOneLine(row.stats_breakdown ?? undefined) || "—"}
                  </td>
                  <td
                    className="max-w-[12rem] truncate px-3 py-2 font-mono text-small text-ink-800 text-ink-700"
                    title={reconcileReportEconomicProjectionTitle(row, t)}
                  >
                    {formatEconomicProjectionOneLine(row.economic_projection_row_counts ?? undefined) || "—"}
                  </td>
                  <td
                    className="max-w-[11rem] truncate px-3 py-2 font-mono text-small text-ink-800 text-ink-700"
                    title={reconcileReportEventLogEscrowTitle(row, t)}
                  >
                    {formatEventLogEscrowCoverageOneLine(row.event_log_escrow_coverage ?? undefined) || "—"}
                  </td>
                  <td className="px-3 py-2 text-meta text-ink-600">{formatReconcileReportCreatedAt(row.created_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/indexer/reconcile/${encodeURIComponent(row.id)}`}
                      className={adminTableRowPrimaryActionClass()}
                      aria-label={t("admin_indexer_reconcile_reports_open_row_aria", { id: row.id })}
                    >
                      {t("admin_indexer_reconcile_reports_open")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!error && (items.length > 0 || !loading) && total > 0 ? (
        <nav
          className="mt-4 flex flex-wrap items-center justify-between gap-3 text-body text-ink-700"
          aria-label={t("admin_indexer_reconcile_reports_pagination_aria")}
        >
          <p className="text-meta text-ink-600">
            {t("admin_indexer_reconcile_reports_range")
              .replace("{from}", String(rangeFrom))
              .replace("{to}", String(rangeTo))
              .replace("{total}", String(total))}
            {" · "}
            {t("admin_indexer_reconcile_reports_page_of")
              .replace("{page}", String(page))
              .replace("{pages}", String(totalPages))}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={`inline-flex min-h-[44px] items-center justify-start ${ADMIN_FORM_CONTROL_SM_CLASS} px-2 py-1.5 text-small text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              value={limit}
              aria-label={t("admin_indexer_reconcile_reports_per_page_label")}
              title={t("admin_indexer_reconcile_reports_per_page_label")}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(next)) return;
                onPerPageLimitChange(next);
              }}
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            {page > 1 ? (
              <Link
                href={listQuery(page - 1, limit)}
                className={`${touchTargetLink44Classes} ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                aria-label={t("admin_indexer_reconcile_reports_prev_aria", { page: String(page - 1) })}
              >
                {t("admin_indexer_reconcile_reports_prev")}
              </Link>
            ) : (
              <span className={ADMIN_PAGINATION_DISABLED_CLASS}>
                {t("admin_indexer_reconcile_reports_prev")}
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={listQuery(page + 1, limit)}
                className={`${touchTargetLink44Classes} ${ADMIN_FILTER_RESET_BTN_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
                aria-label={t("admin_indexer_reconcile_reports_next_aria", { page: String(page + 1) })}
              >
                {t("admin_indexer_reconcile_reports_next")}
              </Link>
            ) : (
              <span className={ADMIN_PAGINATION_DISABLED_CLASS}>
                {t("admin_indexer_reconcile_reports_next")}
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </>
  );
}
