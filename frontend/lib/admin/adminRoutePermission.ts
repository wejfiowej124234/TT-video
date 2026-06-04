import { ADMIN_HOME_CARD_REQUIRED_PERM } from "./adminHomeCardPermission";
import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** 子路径 / 详情页：最长前缀优先。 */
const ADMIN_ROUTE_PREFIX_PERM: { prefix: string; permission: AdminPermissionId }[] = [
  { prefix: "/admin/compliance/requests/", permission: ADMIN_PERM.READ },
  { prefix: "/admin/onboarding/entitlements/", permission: ADMIN_PERM.ONBOARDING_WRITE },
  { prefix: "/admin/community/appeals/review", permission: ADMIN_PERM.COMMUNITY_SUPER },
  { prefix: "/admin/users/", permission: ADMIN_PERM.USERS_READ },
  { prefix: "/admin/guides/", permission: ADMIN_PERM.USERS_READ },
  { prefix: "/admin/orders/", permission: ADMIN_PERM.ORDERS_READ },
  { prefix: "/admin/disputes/", permission: ADMIN_PERM.ORDERS_READ },
  { prefix: "/admin/reviews/", permission: ADMIN_PERM.READ },
  { prefix: "/admin/approvals/", permission: ADMIN_PERM.APPROVE },
  { prefix: "/admin/audit/logs/", permission: ADMIN_PERM.READ },
  { prefix: "/admin/indexer/reconcile/", permission: ADMIN_PERM.READ },
  { prefix: "/admin/config/releases/", permission: ADMIN_PERM.PLATFORM_PUBLISH },
  { prefix: "/admin/alerts/incidents/", permission: ADMIN_PERM.READ },
];

const SORTED_HOME_HREFS = Object.keys(ADMIN_HOME_CARD_REQUIRED_PERM).sort(
  (a, b) => b.length - a.length,
);

/** 由 pathname 解析本页应对照的权限（① · 与首页卡片表同源）。 */
export function adminPermissionForPathname(pathname: string): AdminPermissionId | null {
  if (!pathname.startsWith("/admin") || pathname === "/admin") return null;

  const pathOnly = pathname.split("?")[0] ?? pathname;

  for (const { prefix, permission } of ADMIN_ROUTE_PREFIX_PERM) {
    if (pathOnly.startsWith(prefix)) return permission;
  }

  for (const href of SORTED_HOME_HREFS) {
    const base = href.split("#")[0] ?? href;
    if (pathOnly === base || pathOnly.startsWith(`${base}/`)) {
      return ADMIN_HOME_CARD_REQUIRED_PERM[href];
    }
  }

  return ADMIN_PERM.READ;
}
