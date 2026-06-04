/** ① SSOT：统一收件箱任务链与顶栏 onboarding/community 队列 href 对拍。 */
export const ADMIN_INBOX_QUEUE_HREFS = {
  provider: "/admin/provider-applications?status=submitted",
  steward: "/admin/steward-applications?status=stake_pending",
  approvals: "/admin/approvals?status=pending",
  reports: "/admin/community/reports?status=open",
} as const;

/** 审批详情返回列表（带宽版 limit · 与 pending 队列同源） */
export const ADMIN_INBOX_QUEUE_APPROVALS_LIST_HREF = "/admin/approvals?limit=100&status=pending";

export type AdminInboxQueueId = keyof typeof ADMIN_INBOX_QUEUE_HREFS;
