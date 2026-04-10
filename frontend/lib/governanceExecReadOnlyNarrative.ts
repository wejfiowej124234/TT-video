/**
 * 治理「执行态」只读文案与来源标识的 i18n 键 SSOT。
 * 列表（`proposal-status` 行）与详情（`chain.*` / 执行区）应引用此处常量，避免同一状态两处口径漂移。
 */
export const GovExecReadOnlyI18n = {
  /** 列表行与详情投票区共用的「只读、非钱包写入」脚注 */
  readonlyCaption: "governance_exec_shared_readonly_caption",
  /** 列表/详情：链上 SSOT 来源徽标（与 `is_chain_ssot` 一致） */
  sourceSsotBadge: "governance_proposals_exec_ssot_badge",
  /** 列表/详情：投影来源标签 */
  sourceProjectionLabel: "governance_proposals_status_projection_note",
  sourceChainGroupAria: "governance_proposals_status_chain_ssot_aria",
  sourceProjectionGroupAria: "governance_proposals_status_projection_aria",
  /** Governor 回报 **Queued** 时的完整说明（详情「执行条件」与执行骨架第二段共用） */
  sharedQueuedExplanation: "governance_exec_shared_queued_explanation",
  /** 执行骨架：全状态通用的无时序 SSOT + 占位说明（不含 Queued 专段，专段见 sharedQueuedExplanation） */
  sharedLimitsSkeleton: "governance_exec_shared_limits_skeleton",
  /** 列表行：Queued 与同详情一致的短提示 */
  sharedListQueuedHint: "governance_exec_shared_list_queued_hint",
  /** 列表→详情闭环：列表区入口说明（与详情承接同一套只读/来源口径） */
  listEntryBridge: "governance_exec_list_entry_bridge",
  /** 列表→详情闭环：详情页承接说明 */
  detailContinuationBridge: "governance_exec_detail_continuation_bridge",
  /** 链上列表行标题链：跳转详情的补充语义（title） */
  proposalLinkContinueTitle: "governance_exec_proposal_link_continue_title",
} as const;

/** 列表项 `Link` 的 `aria-describedby`，指向同页桥接文案 */
export const GOV_EXEC_LIST_BRIDGE_DOM_ID = "gov-exec-list-bridge";

export type GovExecReadOnlyI18nKey = (typeof GovExecReadOnlyI18n)[keyof typeof GovExecReadOnlyI18n];

/** 与详情 `deriveGovernanceExecutionReadiness` 中 Queued 分桶对齐（仅小写比较） */
export function isGovernorStateLabelQueued(status: string): boolean {
  return status.trim().toLowerCase() === "queued";
}
