import Link from "next/link";

import type { AdminFinanceTranslate, FinanceSummary } from "./adminFinancePageTypes";
import {
  ADMIN_HUB_LINK_CARD_INNER_CLASS,
  ADMIN_CONSOLE_MUTED_BLOCK_CLASS,
  adminHubKpiLinkClass,
} from "@/lib/adminUi";

export type AdminFinanceSummaryGridSectionProps = {
  t: AdminFinanceTranslate;
  summary: FinanceSummary;
};

const kpiLinkClass = adminHubKpiLinkClass();

export function AdminFinanceSummaryGridSection({ t, summary }: AdminFinanceSummaryGridSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link href="/admin/orders" className={kpiLinkClass} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_orderCount")}</h2>
          <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.order_count ?? 0}</p>
        </span>
      </Link>

      <Link href="/admin/disputes" className={kpiLinkClass} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeCount")}</h2>
          <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.dispute_count ?? 0}</p>
        </span>
      </Link>

      <Link href="/admin/orders" className={kpiLinkClass} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_ordersEscrowAddr")}</h2>
          <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.orders_with_escrow_address_count ?? 0}</p>
        </span>
      </Link>

      <Link href="/admin/orders" className={kpiLinkClass} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_amountParseErrors")}</h2>
          <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.orders_amount_parse_error_count ?? 0}</p>
        </span>
      </Link>

      <Link href="/admin/disputes" className={`${kpiLinkClass} sm:col-span-2`} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeStatusCounts")}</h2>
          <pre className={`mt-2 overflow-auto p-3 text-small text-ink-700 ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}`}>
            {JSON.stringify(summary.dispute_status_counts ?? {}, null, 2)}
          </pre>
        </span>
      </Link>

      <Link href="/admin/orders" className={`${kpiLinkClass} sm:col-span-2`} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_stateCounts")}</h2>
          <pre className={`mt-2 overflow-auto p-3 text-small text-ink-700 ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}`}>
            {JSON.stringify(summary.state_counts ?? {}, null, 2)}
          </pre>
        </span>
      </Link>

      <Link href="/admin/orders" className={`${kpiLinkClass} sm:col-span-2`} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_totalByCurrency")}</h2>
          <pre className={`mt-2 overflow-auto p-3 text-small text-ink-700 ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}`}>
            {JSON.stringify(summary.total_amount_by_currency ?? {}, null, 2)}
          </pre>
        </span>
      </Link>

      <Link href="/admin/orders" className={`${kpiLinkClass} sm:col-span-2`} data-tt-admin-hub-kpi-link="1">
        <span className={ADMIN_HUB_LINK_CARD_INNER_CLASS}>
          <h2 className="text-body font-medium text-ink-800">{t("admin_finance_escrowedByCurrency")}</h2>
          <pre className={`mt-2 overflow-auto p-3 text-small text-ink-700 ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}`}>
            {JSON.stringify(summary.escrowed_amount_by_currency ?? {}, null, 2)}
          </pre>
        </span>
      </Link>
    </div>
  );
}
