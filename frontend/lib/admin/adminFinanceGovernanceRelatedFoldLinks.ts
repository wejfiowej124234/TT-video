import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

const GOVERNANCE_PEER_BY_PATH: Record<string, AdminOpsDetailRelatedLink[]> = {
  "/admin/cross-check": [
    { href: "/admin/drift-summary", labelKey: "admin_drift_summary_title" },
    { href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
    {
      href: "/admin/indexer/reconcile-reports",
      labelKey: "admin_fin_suite_supplement_reconcile_reports",
    },
  ],
  "/admin/drift-summary": [
    { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
    { href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
    {
      href: "/admin/indexer/reconcile-reports",
      labelKey: "admin_fin_suite_supplement_reconcile_reports",
    },
  ],
  "/admin/finance-reconciliation": [
    { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
    { href: "/admin/drift-summary", labelKey: "admin_drift_summary_title" },
    {
      href: "/admin/indexer/reconcile-reports",
      labelKey: "admin_fin_suite_supplement_reconcile_reports",
    },
  ],
};

/** 财务治理只读子页 · 折叠 peer 入口（顶栏仅保留七件套回链）。 */
export function financeGovernanceRelatedFoldLinks(currentHref: string): AdminOpsDetailRelatedLink[] {
  return GOVERNANCE_PEER_BY_PATH[currentHref] ?? [];
}
