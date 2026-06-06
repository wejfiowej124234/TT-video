import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** DSAR 请求列表 · 折叠交叉入口。 */
export const COMPLIANCE_REQUESTS_LIST_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/compliance", labelKey: "admin_compliance_hub_title" },
  { href: "/admin/permissions", labelKey: "admin_permissions_title" },
  { href: "/admin/config", labelKey: "admin_config_hub_title" },
];
