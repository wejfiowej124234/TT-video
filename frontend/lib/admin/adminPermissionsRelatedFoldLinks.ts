import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

/** 权限中心 · 折叠交叉入口。 */
export const PERMISSIONS_PAGE_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: "/admin/operator-guide", labelKey: "admin_operator_guide_title" },
  { href: "/admin/approvals", labelKey: "admin_approvals_title" },
  { href: "/admin/users", labelKey: "admin_users_title" },
];
