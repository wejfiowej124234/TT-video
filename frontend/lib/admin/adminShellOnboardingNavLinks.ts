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
  {
    href: "/admin/onboarding/entitlements",
    labelKey: "admin_onb_entitlements_title",
    permission: ADMIN_PERM.ONBOARDING_READ,
  },
  {
    href: "/admin/onboarding/payment-events",
    labelKey: "admin_onb_payment_events_title",
    permission: ADMIN_PERM.ONBOARDING_READ,
  },
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

/** 枢纽页卡片（不含四队列；含按用户查权益）。 */
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
    href: "/admin/onboarding/entitlements",
    titleKey: "admin_onboarding_hub_entitlements",
    descKey: "admin_onboarding_hub_entitlements_desc",
  },
  {
    href: "/admin/onboarding/payment-events",
    titleKey: "admin_onb_payment_events_title",
    descKey: "admin_onb_payment_events_subtitle_l5",
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
