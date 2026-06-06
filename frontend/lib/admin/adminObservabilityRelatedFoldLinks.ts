import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 可观测域 peer 页 · 折叠交叉入口 SSOT（枢纽与子页共用）。 */
export const OBSERVABILITY_PEER_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/audit", labelKey: "admin_observability_linkAuditLogs" },
  { href: "/admin/audit/operations", labelKey: "admin_observability_linkAuditOps" },
  { href: "/admin/auth-audit-events", labelKey: "admin_auth_audit_events_title" },
  { href: "/admin/indexer/reconcile-reports", labelKey: "admin_observability_linkReconcileReports" },
  { href: "/admin/alerts/incidents", labelKey: "admin_observability_linkIncidents" },
  { href: "/admin/trust-growth", labelKey: "admin_shell_nav_trust_growth" },
  { href: "/admin/schema", labelKey: "admin_schema_title" },
  { href: "/admin/config", labelKey: "admin_config_hub_title" },
  { href: "/admin/compliance", labelKey: "admin_shell_nav_compliance" },
];

/** 可观测子页 · 折叠 peer（可选排除当前页）。 */
export function observabilityPeerRelatedFoldLinks(excludeHref?: string): AdminOpsDetailRelatedLink[] {
  if (!excludeHref) return OBSERVABILITY_PEER_RELATED_FOLD_LINKS;
  return OBSERVABILITY_PEER_RELATED_FOLD_LINKS.filter((l) => l.href !== excludeHref);
}
