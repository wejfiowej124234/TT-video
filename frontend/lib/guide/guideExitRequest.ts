/**
 * 向导退出申请门闸 SSOT（① 本地 · 81 §5.3）。
 * ② Admin 审核 · 冷却期 · 链上 withdraw — STK-P2-013～015。
 */

export type GuideExitRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type GuideExitStatusPayload = {
  guide_id?: string;
  guide_status?: string;
  can_accept_orders?: boolean;
  exit_request?: {
    id?: string;
    status?: GuideExitRequestStatus;
    reason?: string | null;
    requested_at?: string;
    updated_at?: string;
  } | null;
};

export function isGuideExitingStatus(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase();
  return s === "exiting";
}

export function isGuideExitedStatus(status: string | null | undefined): boolean {
  const s = status?.trim().toLowerCase();
  return s === "exited";
}

/** 可申请退出：已审核通过且未在退出流中。 */
export function canSubmitGuideExitRequest(guideRegistrationStatus: string | null | undefined): boolean {
  const s = guideRegistrationStatus?.trim().toLowerCase();
  return s === "active" || s === "approved";
}

/**
 * 工作台展示退出卡片：已满足质押或已有退出申请/退出中状态。
 */
export function shouldShowGuideWorkbenchExitRequestCard(input: {
  guideWorkspaceUnlocked: boolean;
  guideRegistrationStatus: string | null | undefined;
  hasStakingActivity: boolean;
  exitStatus?: GuideExitStatusPayload | null;
}): boolean {
  if (!input.guideWorkspaceUnlocked) return false;
  if (isGuideExitingStatus(input.guideRegistrationStatus)) return true;
  if (isGuideExitedStatus(input.guideRegistrationStatus)) return true;
  if (input.exitStatus?.exit_request?.status === "pending") return true;
  if (!input.hasStakingActivity) return false;
  return canSubmitGuideExitRequest(input.guideRegistrationStatus);
}
