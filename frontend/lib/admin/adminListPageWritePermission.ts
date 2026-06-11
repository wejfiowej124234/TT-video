import { adminHomeCardTierForHref } from "./adminHomeCardCapability";
import { ADMIN_HOME_CARD_REQUIRED_PERM } from "./adminHomeCardPermission";
import { ADMIN_PERM, type AdminPermissionId } from "./adminPermissionIds";

/** super_write 路由 → 写权限（与首页 tier 同源 · VIS-03）。 */
const SUPER_WRITE_PERM_BY_BASE: Record<string, AdminPermissionId> = {
  "/admin/approvals": ADMIN_PERM.APPROVE,
  "/admin/community/appeals": ADMIN_PERM.COMMUNITY_SUPER,
  "/admin/lifecycle": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/policies": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/flags": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/jobs": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/config/releases": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/secrets/metadata": ADMIN_PERM.PLATFORM_READ,
  "/admin/scheduler/jobs": ADMIN_PERM.APPROVE,
  "/admin/tenants/scopes": ADMIN_PERM.PLATFORM_PUBLISH,
  "/admin/compliance/requests": ADMIN_PERM.APPROVE,
  "/admin/community/abuse-policy": ADMIN_PERM.COMMUNITY_SUPER,
  "/admin/community/comments/visibility": ADMIN_PERM.COMMUNITY_SUPER,
};

/** write 路由 → 写权限（读-only 列表返回 undefined）。 */
const WRITE_PERM_BY_BASE: Record<string, AdminPermissionId> = {
  "/admin/provider-applications": ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
  "/admin/steward-applications": ADMIN_PERM.ONBOARDING_STEWARD_REVIEW,
  "/admin/users": ADMIN_PERM.USERS_WRITE,
  "/admin/guides": ADMIN_PERM.USERS_WRITE,
  "/admin/guide-applications": ADMIN_PERM.USERS_WRITE,
  "/admin/disputes": ADMIN_PERM.DISPUTES_WRITE,
  "/admin/trust-growth": ADMIN_PERM.TRUST_GROWTH_WRITE,
  "/admin/community/reports": ADMIN_PERM.COMMUNITY_MODERATE,
  "/admin/community/penalties": ADMIN_PERM.COMMUNITY_MODERATE,
};

const ROUTE_BASES = Array.from(
  new Set([
    ...Object.keys(ADMIN_HOME_CARD_REQUIRED_PERM).map((h) => h.split("#")[0] ?? h),
    ...Object.keys(SUPER_WRITE_PERM_BY_BASE),
    ...Object.keys(WRITE_PERM_BY_BASE),
  ]),
).sort((a, b) => b.length - a.length);

/** 由 pathname 推断列表/枢纽页写权限（① L5 · VIS-03）。 */
export function adminWritePermissionForPathname(pathname: string): AdminPermissionId | undefined {
  const path = pathname.split("?")[0] ?? pathname;
  if (!path.startsWith("/admin")) return undefined;

  for (const base of ROUTE_BASES) {
    if (path !== base && !path.startsWith(`${base}/`)) continue;
    const tier = adminHomeCardTierForHref(base);
    if (tier === "super_write") return SUPER_WRITE_PERM_BY_BASE[base];
    if (tier === "write") return WRITE_PERM_BY_BASE[base];
    return undefined;
  }
  return undefined;
}
