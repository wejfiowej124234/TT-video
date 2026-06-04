/** ① SSOT：顶栏「社区」折叠组内链（与收件箱 reports 队列对拍见 adminInboxQueueHrefs）。 */
export const ADMIN_SHELL_COMMUNITY_EXTRA_LINKS = [
  {
    href: "/admin/community/policy-change-logs",
    labelKey: "admin_shell_nav_policy_logs",
    matchPrefix: "/admin/community/policy-change-logs",
  },
  {
    href: "/admin/community/ranking/snapshots",
    labelKey: "admin_shell_nav_rank_snapshots",
    matchPrefix: "/admin/community/ranking",
  },
  {
    href: "/admin/community/comments/visibility",
    labelKey: "admin_shell_nav_comment_vis",
    matchPrefix: "/admin/community/comments",
  },
] as const;
