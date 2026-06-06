import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** 经营组 · 侧栏 / 顶栏 SSOT。 */
export const ADMIN_SHELL_OPERATIONS_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  { href: "/admin/users", labelKey: "admin_users_title", permission: ADMIN_PERM.USERS_READ },
  { href: "/admin/orders", labelKey: "admin_orders_title", permission: ADMIN_PERM.ORDERS_READ },
  { href: "/admin/disputes", labelKey: "admin_disputes_title", permission: ADMIN_PERM.ORDERS_READ },
  { href: "/admin/guides", labelKey: "admin_guides_title", permission: ADMIN_PERM.USERS_READ },
  { href: "/admin/reviews", labelKey: "admin_reviews_title", permission: ADMIN_PERM.READ },
] as const;
