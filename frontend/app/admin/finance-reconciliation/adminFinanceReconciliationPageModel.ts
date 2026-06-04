import type { ChainAlignmentHubStatus } from "@/lib/financeReconciliationDriftStrip";
import { formatApiPathDisplayValue } from "@/lib/financeReconciliationPathValue";

export type FinanceRes = {
  status?: string;
  meta?: unknown;
  summary?: unknown;
  error?: string;
};

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export const FINANCE_RECONCILIATION_NAV_LINKS: readonly { href: string; labelKey: string }[] = [
  { href: "/admin/finance", labelKey: "admin_finance_reconciliation_link_finance" },
  { href: "/admin/cross-check", labelKey: "admin_finance_reconciliation_link_cross_check" },
  { href: "/admin/drift-summary", labelKey: "admin_finance_reconciliation_link_drift" },
  { href: "/admin/indexer", labelKey: "admin_finance_reconciliation_link_indexer" },
  { href: "/admin/indexer/reconcile-reports", labelKey: "admin_finance_reconciliation_link_reconcile_reports" },
];

export function pathRows(
  prefix: string,
  keys: readonly string[],
  obj: Record<string, unknown> | null,
  na: string,
): { path: string; text: string }[] {
  return keys.map((key) => {
    const path = `${prefix}.${key}`;
    const value = obj ? obj[key] : undefined;
    return { path, text: formatApiPathDisplayValue(value, na) };
  });
}

export function financeReconciliationAlignmentBadgeClass(s: ChainAlignmentHubStatus): string {
  if (s === "unknown") return "border-warning bg-warning text-white";
  if (s === "not_aligned") return "border-warning bg-warning text-white";
  return "border-ink-200 bg-ink-100 text-ink-800";
}
