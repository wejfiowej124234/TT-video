import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 审计域 peer 页 · 折叠交叉入口 SSOT。 */
export const AUDIT_PEER_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/audit", labelKey: "admin_audit_list_title" },
  { href: "/admin/audit/operations", labelKey: "admin_audit_ops_title" },
  { href: "/admin/auth-audit-events", labelKey: "admin_auth_audit_events_title" },
  { href: "/admin/observability", labelKey: "admin_observability_title" },
];

/** 审计子页 · 折叠 peer（可选排除当前页）。 */
export function auditPeerRelatedFoldLinks(excludeHref?: string): AdminOpsDetailRelatedLink[] {
  if (!excludeHref) return AUDIT_PEER_RELATED_FOLD_LINKS;
  return AUDIT_PEER_RELATED_FOLD_LINKS.filter((l) => l.href !== excludeHref);
}
