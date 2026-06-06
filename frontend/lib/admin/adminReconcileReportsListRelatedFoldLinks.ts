import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 对账报告列表 · 折叠交叉入口（索引器回链保留顶栏 pill）。 */
export const RECONCILE_REPORTS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
  { href: "/admin/drift-summary", labelKey: "admin_drift_summary_title" },
  { href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
  { href: "/admin/finance-suite", labelKey: "admin_fin_suite_title" },
];
