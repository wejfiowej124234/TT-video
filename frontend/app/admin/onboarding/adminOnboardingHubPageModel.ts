import type { AdminOpsDetailRelatedLink } from "@/components/admin/AdminOpsDetailRelatedFold";

import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import {
  ADMIN_ONBOARDING_HUB_PAGE_LINKS,
  ADMIN_SHELL_ONBOARDING_NAV_LINKS,
} from "@/lib/admin/adminShellOnboardingNavLinks";

export const ONBOARDING_HUB_LINKS = [...ADMIN_ONBOARDING_HUB_PAGE_LINKS];

/** 入驻枢纽 · 折叠交叉入口（卡片入口保留首屏）。 */
export const ONBOARDING_HUB_RELATED_FOLD_LINKS: AdminOpsDetailRelatedLink[] = [
  { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_provider_list_title" },
  { href: ADMIN_INBOX_QUEUE_HREFS.steward, labelKey: "admin_steward_list_title" },
  { href: "/admin/approvals", labelKey: "admin_approvals_title" },
  ...ADMIN_SHELL_ONBOARDING_NAV_LINKS.filter((link) => link.href.startsWith("/admin/onboarding/")).map(
    ({ href, labelKey }) => ({ href, labelKey }),
  ),
  ...ONBOARDING_HUB_LINKS.filter(({ href }) => href === "/admin/users").map(({ href, titleKey }) => ({
    href,
    labelKey: titleKey,
  })),
];
