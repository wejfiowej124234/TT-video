import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 管理员操作手册 · 折叠交叉入口。 */
export const OPERATOR_GUIDE_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/inbox", labelKey: "admin_unified_inbox_title" },
  { href: "/admin/permissions", labelKey: "admin_permissions_title" },
  { href: "/admin/approvals", labelKey: "admin_approvals_title" },
];
