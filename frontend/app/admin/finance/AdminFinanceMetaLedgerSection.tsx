import Link from "next/link";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminFinanceDerived } from "./adminFinancePageDerived";
import type { AdminFinanceTranslate, FinanceMeta } from "./adminFinancePageTypes";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_HUB_DEPTH_LINK_CARD_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass,
  ADMIN_CONSOLE_MUTED_PANEL_CLASS,
  ADMIN_INNER_DIVIDER_CLASS,} from "@/lib/adminUi";

const metaLedgerLinkClass = `${touchTargetLink44Classes} !flex-col !items-stretch !justify-start p-3 text-left text-ink-800 ${ADMIN_HUB_DEPTH_LINK_CARD_CLASS} ${ADMIN_FORM_FIELD_FOCUS_CLASS}`;
export type AdminFinanceMetaLedgerSectionProps = {
  t: AdminFinanceTranslate;
  financeMetaDlHeadingId: string;
  meta: FinanceMeta;
  derived: AdminFinanceDerived;
};

export function AdminFinanceMetaLedgerSection({
  t,
  financeMetaDlHeadingId,
  meta,
  derived,
}: AdminFinanceMetaLedgerSectionProps) {
  const {
    generatedAt,
    feeRouterStats,
    regionVaultStats,
    lastProjReconcile,
    lastReportId,
    projectionClean,
    issuesN,
  } = derived;

  return (
    <div className={`${ADMIN_CONSOLE_MUTED_PANEL_CLASS} p-4`}>
      <Link
        href="/admin/indexer/reconcile-reports"
        className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start -mx-1 -mt-1 rounded-[var(--radius-md)] px-1 pt-1 text-left text-ink-800 transition motion-reduce:transition-none hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
        aria-labelledby={financeMetaDlHeadingId}
      >
        <h2 id={financeMetaDlHeadingId} className="text-body font-medium text-ink-800">
          {t("admin_finance_meta_title")}
        </h2>
        <dl className="mt-2 grid gap-2 text-small text-ink-700 sm:grid-cols-2">
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_source")}</dt>
            <dd className="font-mono">{meta.source ?? t("admin_em_dash")}</dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_generatedAt")}</dt>
            <dd className="font-mono">{generatedAt ?? t("admin_em_dash")}</dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_dbOrderCount")}</dt>
            <dd className="font-mono">
              {meta.db_order_count == null ? t("admin_finance_meta_na") : String(meta.db_order_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_dbEscrowCount")}</dt>
            <dd className="font-mono">
              {meta.db_orders_with_escrow_count == null
                ? t("admin_finance_meta_na")
                : String(meta.db_orders_with_escrow_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_projectionReconcileReportCount")}</dt>
            <dd className="font-mono">
              {meta.orders_projection_reconcile_report_count == null
                ? t("admin_finance_meta_na")
                : String(meta.orders_projection_reconcile_report_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">{t("admin_finance_meta_reconciliationReportsTotalCount")}</dt>
            <dd className="font-mono">
              {meta.reconciliation_reports_total_count == null
                ? t("admin_finance_meta_na")
                : String(meta.reconciliation_reports_total_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">
              {t("admin_finance_meta_reconciliationReportsWithOpenIssuesCount")}
            </dt>
            <dd className="font-mono">
              {meta.reconciliation_reports_with_open_issues_count == null
                ? t("admin_finance_meta_na")
                : String(meta.reconciliation_reports_with_open_issues_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">
              {t("admin_finance_meta_reconciliationReportsProjectionUncleanCount")}
            </dt>
            <dd className="font-mono">
              {meta.reconciliation_reports_projection_unclean_count == null
                ? t("admin_finance_meta_na")
                : String(meta.reconciliation_reports_projection_unclean_count)}
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-500">
              {t("admin_finance_meta_reconciliationReportsProjectionCleanCount")}
            </dt>
            <dd className="font-mono">
              {meta.reconciliation_reports_projection_clean_count == null
                ? t("admin_finance_meta_na")
                : String(meta.reconciliation_reports_projection_clean_count)}
            </dd>
          </div>
        </dl>
      </Link>

      <div className={`mt-4 ${ADMIN_INNER_DIVIDER_CLASS} pt-4`}>
        <h3 className="text-small font-semibold text-ink-800">{t("admin_finance_ledger_db_title")}</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/fee-router#admin-fee-router-events"
            className={metaLedgerLinkClass}
          >
            <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_feeRouterHeading")}</p>
            <dl className="mt-2 text-small text-ink-700">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                <dt className="text-meta text-ink-500 shrink-0">{t("admin_finance_meta_feeRouterEnvAddress")}</dt>
                <dd className="font-mono text-right break-all sm:text-left">
                  {typeof meta.fee_router_address === "string" && meta.fee_router_address.trim()
                    ? meta.fee_router_address.trim()
                    : t("admin_finance_meta_na")}
                </dd>
              </div>
            </dl>
            {feeRouterStats ? (
              <dl className="mt-2 space-y-1 text-small text-ink-700">
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_fee_router_summaryTotal")}</dt>
                  <dd className="font-mono">
                    {feeRouterStats.total != null ? String(feeRouterStats.total) : t("ui_em_dash")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_fee_router_blockRange")}</dt>
                  <dd className="font-mono text-right">
                    {feeRouterStats.min_block_number != null && feeRouterStats.max_block_number != null
                      ? `${String(feeRouterStats.min_block_number)}–${String(feeRouterStats.max_block_number)}`
                      : t("admin_finance_meta_na")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_fee_router_latestInserted")}</dt>
                  <dd className="font-mono text-right text-meta">
                    {typeof feeRouterStats.latest_inserted_at === "string" &&
                    !Number.isNaN(Date.parse(feeRouterStats.latest_inserted_at))
                      ? new Date(feeRouterStats.latest_inserted_at).toLocaleString()
                      : t("admin_finance_meta_na")}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
            )}
          </Link>
          <Link
            href="/admin/region-vault#admin-region-vault-events"
            className={metaLedgerLinkClass}
          >
            <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_regionVaultHeading")}</p>
            <dl className="mt-2 text-small text-ink-700">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                <dt className="text-meta text-ink-500 shrink-0">{t("admin_finance_meta_regionVaultEnvAddress")}</dt>
                <dd className="font-mono text-right break-all sm:text-left">
                  {typeof meta.region_vault_address === "string" && meta.region_vault_address.trim()
                    ? meta.region_vault_address.trim()
                    : t("admin_finance_meta_na")}
                </dd>
              </div>
            </dl>
            {regionVaultStats ? (
              <dl className="mt-2 space-y-1 text-small text-ink-700">
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_region_vault_summaryTotal")}</dt>
                  <dd className="font-mono">
                    {regionVaultStats.total != null ? String(regionVaultStats.total) : t("ui_em_dash")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_region_vault_blockRange")}</dt>
                  <dd className="font-mono text-right">
                    {regionVaultStats.min_block_number != null && regionVaultStats.max_block_number != null
                      ? `${String(regionVaultStats.min_block_number)}–${String(regionVaultStats.max_block_number)}`
                      : t("admin_finance_meta_na")}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>{t("admin_region_vault_latestInserted")}</dt>
                  <dd className="font-mono text-right text-meta">
                    {typeof regionVaultStats.latest_inserted_at === "string" &&
                    !Number.isNaN(Date.parse(regionVaultStats.latest_inserted_at))
                      ? new Date(regionVaultStats.latest_inserted_at).toLocaleString()
                      : t("admin_finance_meta_na")}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
            )}
          </Link>
          <Link
            href={
              lastReportId
                ? `/admin/indexer/reconcile/${encodeURIComponent(lastReportId)}`
                : "/admin/indexer/reconcile-reports"
            }
            className={`${metaLedgerLinkClass} sm:col-span-2 xl:col-span-1`}
          >
            <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_projectionReconcileHeading")}</p>
            {lastProjReconcile ? (
              <div className="mt-2 space-y-1 text-small text-ink-700">
                {typeof lastProjReconcile.report_type === "string" && lastProjReconcile.report_type.trim() ? (
                  <p className="text-meta font-mono text-ink-700">
                    {t("admin_indexer_last_reconcile_report_type", {
                      type: lastProjReconcile.report_type.trim(),
                    })}
                  </p>
                ) : null}
                <p className="text-body text-ink-700">
                  {projectionClean === true
                    ? t("admin_indexer_last_reconcile_clean_yes")
                    : projectionClean === false
                      ? t("admin_indexer_last_reconcile_clean_no")
                      : t("admin_indexer_last_reconcile_clean_unknown")}
                </p>
                <p className="text-body text-ink-600">
                  {issuesN != null
                    ? t("admin_indexer_last_reconcile_issues", {
                        count: String(issuesN),
                        colon: t("market_fin_colon"),
                      })
                    : t("admin_indexer_last_reconcile_issues_unknown", { colon: t("market_fin_colon") })}
                </p>
                <p className="text-meta text-ink-600">
                  {typeof lastProjReconcile.chain_id === "number"
                    ? t("admin_indexer_last_reconcile_chain", { id: String(lastProjReconcile.chain_id) })
                    : t("admin_indexer_last_reconcile_chain_unknown")}
                </p>
                {typeof lastProjReconcile.created_at === "string" &&
                  !Number.isNaN(Date.parse(lastProjReconcile.created_at)) && (
                    <p className="text-meta text-ink-500">
                      {t("admin_indexer_last_reconcile_at", {
                        ts: new Date(lastProjReconcile.created_at).toLocaleString(),
                      })}
                    </p>
                  )}
                {lastReportId ? (
                  <p className="pt-1 text-small font-medium text-ink-700">{t("admin_indexer_last_reconcile_open")}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
            )}
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-small">
          <Link
            href="/admin/fee-router"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_finance_link_fee_router")}
          </Link>
          <Link
            href="/admin/region-vault#admin-region-vault-events"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_finance_link_region_vault")}
          </Link>
          <Link
            href="/admin/indexer"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_finance_link_indexer")}
          </Link>
          <Link
            href="/admin/indexer/reconcile-reports"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_finance_link_reconcile_reports")}
          </Link>
        </div>
      </div>

      <p className="mt-3 text-meta text-ink-500">{t("admin_finance_meta_hint")}</p>
    </div>
  );
}
