import type { AdminUnifiedInboxTask } from "@/lib/admin/adminUnifiedInboxTasks";

/** ① 经营动线：商家 → 向导 → 主理人 → 审批 → 争议 → 社区（与首页待办六队列同源）。 */
export const ADMIN_INBOX_WORKFLOW_IDS = [
  "provider",
  "guide",
  "steward",
  "approvals",
  "disputes",
  "reports",
] as const;

export type AdminInboxWorkflowId = (typeof ADMIN_INBOX_WORKFLOW_IDS)[number];

const WORKFLOW_RANK: Record<AdminInboxWorkflowId, number> = {
  provider: 0,
  guide: 1,
  steward: 2,
  approvals: 3,
  disputes: 4,
  reports: 5,
};

export function adminInboxWorkflowRank(id: string): number {
  return WORKFLOW_RANK[id as AdminInboxWorkflowId] ?? 99;
}

/** 有待办优先，同组内按动线序；无权限通道置底。 */
export function sortAdminUnifiedInboxTasks(tasks: AdminUnifiedInboxTask[]): AdminUnifiedInboxTask[] {
  return [...tasks].sort((a, b) => {
    if (a.permissionDenied !== b.permissionDenied) {
      return a.permissionDenied ? 1 : -1;
    }
    const aWork = (a.count ?? 0) > 0;
    const bWork = (b.count ?? 0) > 0;
    if (aWork !== bWork) return aWork ? -1 : 1;
    return adminInboxWorkflowRank(a.id) - adminInboxWorkflowRank(b.id);
  });
}
