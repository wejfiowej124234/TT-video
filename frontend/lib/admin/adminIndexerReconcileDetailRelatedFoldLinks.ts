import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 对账报告详情 · 折叠交叉入口（列表回链保留顶栏）。 */
export const INDEXER_RECONCILE_DETAIL_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/indexer", labelKey: "admin_indexer_reconcile_backIndexer" },
  { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
  { href: "/admin/drift-summary", labelKey: "admin_drift_summary_title" },
  { href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
];
