import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdminShellNavLinkDef } from "@/lib/admin/adminShellNavLinkTypes";

/** 社区组 · 侧栏 / 顶栏 / 首页卡片并集 SSOT。 */
export const ADMIN_SHELL_COMMUNITY_NAV_LINKS: readonly AdminShellNavLinkDef[] = [
  {
    href: ADMIN_INBOX_QUEUE_HREFS.reports,
    labelKey: "admin_shell_nav_community_hub",
    permission: ADMIN_PERM.COMMUNITY_READ,
  },
  { href: "/admin/community/penalties", labelKey: "admin_penalties_title", permission: ADMIN_PERM.COMMUNITY_MODERATE },
  { href: "/admin/community/appeals", labelKey: "admin_appeals_title", permission: ADMIN_PERM.COMMUNITY_READ },
  {
    href: "/admin/community/moderation/cases",
    labelKey: "admin_shell_nav_mod_cases",
    permission: ADMIN_PERM.COMMUNITY_READ,
    matchPrefix: "/admin/community/moderation",
  },
  {
    href: "/admin/community/risk-signals",
    labelKey: "admin_shell_nav_risk_signals",
    permission: ADMIN_PERM.COMMUNITY_READ,
    matchPrefix: "/admin/community/risk-signals",
  },
  {
    href: "/admin/community/policy-change-logs",
    labelKey: "admin_shell_nav_policy_logs",
    permission: ADMIN_PERM.COMMUNITY_READ,
    matchPrefix: "/admin/community/policy-change-logs",
  },
  {
    href: "/admin/community/ranking/snapshots",
    labelKey: "admin_shell_nav_rank_snapshots",
    permission: ADMIN_PERM.COMMUNITY_READ,
    matchPrefix: "/admin/community/ranking",
  },
  {
    href: "/admin/community/comments/visibility",
    labelKey: "admin_shell_nav_comment_vis",
    permission: ADMIN_PERM.COMMUNITY_SUPER,
    matchPrefix: "/admin/community/comments",
  },
  {
    href: "/admin/community/abuse-policy",
    labelKey: "admin_abuse_title",
    permission: ADMIN_PERM.COMMUNITY_SUPER,
    matchPrefix: "/admin/community/abuse-policy",
  },
] as const;

/** @deprecated 使用 `ADMIN_SHELL_COMMUNITY_NAV_LINKS`；保留 batch25 契约键名。 */
export const ADMIN_SHELL_COMMUNITY_EXTRA_LINKS = ADMIN_SHELL_COMMUNITY_NAV_LINKS.filter((link) =>
  [
    "/admin/community/policy-change-logs",
    "/admin/community/ranking/snapshots",
    "/admin/community/comments/visibility",
  ].includes(link.href.split("?")[0] ?? link.href),
).map(({ href, labelKey, matchPrefix }) => ({
  href,
  labelKey,
  matchPrefix: matchPrefix ?? href,
}));
