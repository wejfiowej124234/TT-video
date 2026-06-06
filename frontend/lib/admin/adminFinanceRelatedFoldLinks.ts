import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";
import { ADMIN_OPS_OBSERVABILITY_RELATED_LINK } from "@/lib/admin/adminOpsListRelatedFoldLinks";

const FINANCE_PEER_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/finance-suite", labelKey: "admin_fin_suite_title" },
  { href: "/admin/finance", labelKey: "admin_finance_title" },
  { href: "/admin/fee-router", labelKey: "admin_fee_router_title" },
  { href: "/admin/region-vault", labelKey: "admin_region_vault_title" },
  { href: "/admin/disputes", labelKey: "admin_fin_suite_refunds" },
  { href: "/admin/indexer", labelKey: "admin_indexer_title" },
];

/** 财务子页 · 折叠 peer 入口（排除当前页 · 顶栏仅保留七件套回链）。 */
export function financePeerRelatedFoldLinks(excludeHref: string): AdminOpsDetailRelatedLink[] {
  return FINANCE_PEER_LINKS.filter((l) => l.href !== excludeHref);
}

/** 审计日志列表 · 折叠交叉入口。 */
export const AUDIT_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/auth-audit-events", labelKey: "admin_auth_audit_events_title" },
  { href: "/admin/audit/operations", labelKey: "admin_audit_link_operations" },
  { href: "/admin/finance-suite", labelKey: "admin_fin_suite_title" },
];

/** 索引器枢纽 · 折叠交叉入口。 */
export const INDEXER_HUB_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/indexer/reconcile-reports", labelKey: "admin_indexer_reconcile_reports_title" },
  ...financePeerRelatedFoldLinks("/admin/indexer"),
];

/** 财务七件套枢纽 · 折叠 peer + 治理只读入口。 */
export const FINANCE_SUITE_HUB_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  ...financePeerRelatedFoldLinks("/admin/finance-suite"),
  { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
  { href: "/admin/finance-reconciliation", labelKey: "admin_finance_reconciliation_title" },
];

/** 争议列表 · 折叠交叉入口（与详情页 DISPUTE_DETAIL 对齐 · batch54）。 */
export const DISPUTES_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/orders", labelKey: "admin_orders_title" },
  { href: "/admin/finance-suite", labelKey: "admin_fin_suite_title" },
  { href: "/admin/cross-check", labelKey: "admin_cross_check_title" },
  ADMIN_OPS_OBSERVABILITY_RELATED_LINK,
];
