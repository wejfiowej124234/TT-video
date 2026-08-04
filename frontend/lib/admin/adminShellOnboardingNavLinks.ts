import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_PERM, type AdminPermissionId } from "@/lib/admin/adminPermissionIds";

/** 入驻组 · 侧栏 / 顶栏 / 枢纽交叉入口 SSOT（以枢纽页 + 首页卡片并集为准）。 */
export type AdminShellOnboardingNavLink = {
  href: string;
  labelKey: string;
  permission?: AdminPermissionId;
  /** 枢纽根 `/admin/onboarding` 不与子路径前缀共激活 */
  activeExact?: boolean;
};

export const ADMIN_SHELL_ONBOARDING_NAV_LINKS: readonly AdminShellOnboardingNavLink[] = [
  {
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    labelKey: "admin_shell_nav_provider_queue",
    permission: ADMIN_PERM.ONBOARDING_PROVIDER_REVIEW,
  },
  {
    href: "/admin/guide-applications",
    labelKey: "admin_guide_list_title",
    permission: ADMIN_PERM.USERS_WRITE,
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    labelKey: "admin_shell_nav_steward_queue",
    permission: ADMIN_PERM.ONBOARDING_STEWARD_REVIEW,
  },
  {
    href: ADMIN_INBOX_QUEUE_HREFS.approvals,
    labelKey: "admin_shell_nav_approvals_queue",
    permission: ADMIN_PERM.APPROVE,
  },
  {
    href: "/admin/onboarding",
    labelKey: "admin_onboarding_hub_title",
    permission: ADMIN_PERM.ONBOARDING_READ,
    activeExact: true,
  },
  /** V65-PROD-003 G065/G075：准入费 entitlements / payment-events 退出侧栏（路径仍可直达至下线） */
  {
    href: "/admin/onboarding/webhook-jobs",
    labelKey: "admin_onboarding_hub_webhooks",
    permission: ADMIN_PERM.ONBOARDING_READ,
  },
  {
    href: "/admin/onboarding/compliance-audit",
    labelKey: "admin_onboarding_hub_compliance",
    permission: ADMIN_PERM.ONBOARDING_READ,
  },
] as const;

/** 枢纽页卡片（不含四队列；不含准入费账本入口 — Owner REMOVE_ENTRY_FEE_HUB）。 */
export const ADMIN_ONBOARDING_HUB_PAGE_LINKS: readonly {
  href: string;
  titleKey: string;
  descKey: string;
}[] = [
  {
    href: "/admin/users",
    titleKey: "admin_onboarding_hub_users",
    descKey: "admin_onboarding_hub_users_desc",
  },
  {
    href: "/admin/onboarding/webhook-jobs",
    titleKey: "admin_onboarding_hub_webhooks",
    descKey: "admin_onboarding_hub_webhooks_desc",
  },
  {
    href: "/admin/onboarding/compliance-audit",
    titleKey: "admin_onboarding_hub_compliance",
    descKey: "admin_onboarding_hub_compliance_desc",
  },
] as const;

export function adminShellOnboardingNavLinkMatch(
  link: AdminShellOnboardingNavLink,
): (pathname: string) => boolean {
  const base = link.href.split("?")[0] ?? link.href;
  if (link.activeExact) {
    return (pathname) => pathname === base || pathname === `${base}/`;
  }
  return (pathname) => pathname === base || pathname.startsWith(`${base}/`);
}
