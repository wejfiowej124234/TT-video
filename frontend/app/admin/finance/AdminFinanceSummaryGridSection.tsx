import Link from "next/link";

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import type { AdminFinanceTranslate, FinanceSummary } from "./adminFinancePageTypes";
import { ADMIN_FILTER_CARD_CLASS, ADMIN_FORM_FIELD_FOCUS_CLASS } from "@/lib/adminUi";
export type AdminFinanceSummaryGridSectionProps = {
  t: AdminFinanceTranslate;
  summary: FinanceSummary;
};

export function AdminFinanceSummaryGridSection({ t, summary }: AdminFinanceSummaryGridSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_orderCount")}</h2>
        <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.order_count ?? 0}</p>
      </Link>

      <Link
        href="/admin/disputes"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeCount")}</h2>
        <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.dispute_count ?? 0}</p>
      </Link>

      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_ordersEscrowAddr")}</h2>
        <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.orders_with_escrow_address_count ?? 0}</p>
      </Link>

      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_amountParseErrors")}</h2>
        <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.orders_amount_parse_error_count ?? 0}</p>
      </Link>

      <Link
        href="/admin/disputes"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 sm:col-span-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeStatusCounts")}</h2>
        <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
          {JSON.stringify(summary.dispute_status_counts ?? {}, null, 2)}
        </pre>
      </Link>

      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 sm:col-span-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_stateCounts")}</h2>
        <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
          {JSON.stringify(summary.state_counts ?? {}, null, 2)}
        </pre>
      </Link>

      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 sm:col-span-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_totalByCurrency")}</h2>
        <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
          {JSON.stringify(summary.total_amount_by_currency ?? {}, null, 2)}
        </pre>
      </Link>

      <Link
        href="/admin/orders"
        className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start ${ADMIN_FILTER_CARD_CLASS} text-ink-800 shadow-soft transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 sm:col-span-2 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
      >
        <h2 className="text-body font-medium text-ink-800">{t("admin_finance_escrowedByCurrency")}</h2>
        <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
          {JSON.stringify(summary.escrowed_amount_by_currency ?? {}, null, 2)}
        </pre>
      </Link>
    </div>
  );
}
