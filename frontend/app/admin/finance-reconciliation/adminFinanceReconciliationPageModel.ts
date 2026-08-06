import type { ChainAlignmentHubStatus } from "@/lib/financeReconciliationDriftStrip";
import { formatApiPathDisplayValue } from "@/lib/financeReconciliationPathValue";
import {
  ADMIN_FIN_RECON_ALIGNED_BADGE_CLASS,
  ADMIN_FIN_RECON_MISALIGNED_BADGE_CLASS,
} from "@/lib/adminUi";

export type FinanceRes = {
  status?: string;
  meta?: unknown;
  summary?: unknown;
  error?: string;
};

/** Full finance summary body stashed in list-fetch meta (`useAdminFinanceReconciliationPage`). */
export const ADMIN_FINANCE_RECON_BODY_META_KEY = "__adminFinanceReconBody";

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export const FINANCE_RECONCILIATION_NAV_LINKS: readonly { href: string; labelKey: string }[] = [
  { href: "/admin/finance-suite", labelKey: "admin_finance_reconciliation_link_finance" },
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
  if (s === "unknown" || s === "not_aligned") return ADMIN_FIN_RECON_MISALIGNED_BADGE_CLASS;
  return ADMIN_FIN_RECON_ALIGNED_BADGE_CLASS;
}
