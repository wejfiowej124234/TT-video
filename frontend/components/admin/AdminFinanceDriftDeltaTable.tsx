"use client";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminFinanceDriftDeltaRow } from "@/lib/admin/adminFinanceDriftDeltaTable";
import { adminFinanceDriftDeltaRows } from "@/lib/admin/adminFinanceDriftDeltaTable";
import { ADMIN_CONSOLE_MUTED_BLOCK_CLASS } from "@/lib/adminUi";

type Props = {
  delta: unknown;
  /** data-tt suffix for smoke */
  surface: "drift-summary" | "cross-check";
};

/** HU-278 · Product diff summary table (empty = aligned). */
export function AdminFinanceDriftDeltaTable({ delta, surface }: Props) {
  const { t } = useTranslation();
  const rows: AdminFinanceDriftDeltaRow[] = adminFinanceDriftDeltaRows(delta);

  if (rows.length === 0) {
    return (
      <p
        className="mt-2 text-body text-ink-700"
        data-tt-admin-finance-drift-delta-empty="1"
        data-tt-admin-finance-drift-delta-surface={surface}
      >
        {t("admin_finance_drift_delta_empty_aligned")}
      </p>
    );
  }

  return (
    <div
      className={`mt-2 overflow-x-auto ${ADMIN_CONSOLE_MUTED_BLOCK_CLASS}`}
      data-tt-admin-finance-drift-delta-table="1"
      data-tt-admin-finance-drift-delta-surface={surface}
      data-tt-admin-finance-drift-delta-rows={String(rows.length)}
    >
      <table className="min-w-full text-left text-small text-ink-800">
        <caption className="sr-only">{t("admin_finance_drift_delta_table_caption")}</caption>
        <thead>
          <tr className="border-b border-white/10 text-meta text-ink-500">
            <th scope="col" className="px-3 py-2 font-medium">
              {t("admin_finance_drift_delta_col_key")}
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {t("admin_finance_drift_delta_col_count")}
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {t("admin_finance_drift_delta_col_amount")}
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              {t("admin_finance_drift_delta_col_note")}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-white/5">
              <td className="px-3 py-2 font-mono text-meta">{r.key}</td>
              <td className="px-3 py-2 tabular-nums">{r.count}</td>
              <td className="px-3 py-2 tabular-nums">{r.amount}</td>
              <td className="px-3 py-2">{r.note || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
