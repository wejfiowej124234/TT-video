import type { GovernanceProposalChainSnapshot } from "@/lib/apiClient/governance";

export type GovernanceExecutionReadinessKind =
  | "off_chain_signal"
  | "executable"
  | "before_timelock"
  | "executed"
  | "not_executable"
  | "unknown";

export type GovernanceExecutionReadiness = {
  kind: GovernanceExecutionReadinessKind;
  /** `state_live` 或 `projection_state` 原文，供只读展示；链下模式为空 */
  sourceState: string;
};

function pickReportedState(chain?: GovernanceProposalChainSnapshot | null): string {
  const live = chain?.state_live?.trim();
  if (live) return live;
  const proj = chain?.projection_state?.trim();
  if (proj) return proj;
  return "";
}

function normState(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * 仅从详情 `GET` 已有 `chain.state_live` / `chain.projection_state` 字符串做规范化映射。
 *
 * - **不含**墙钟时间、区块高度、Timelock ETA 或与链上当前时刻的比较；因此 **Queued** 仅表示 Governor
 *   回报状态字，**不能**据此判定延迟是否已满、execute 是否会在链上成功（API 未提供该维度）。
 * - **不做** UI 侧猜测；未知字符串进 `unknown`。
 */
export function deriveGovernanceExecutionReadiness(
  onChainGovernor: boolean,
  chain?: GovernanceProposalChainSnapshot | null,
): GovernanceExecutionReadiness {
  if (!onChainGovernor) {
    return { kind: "off_chain_signal", sourceState: "" };
  }
  const raw = pickReportedState(chain);
  if (!raw) {
    return { kind: "unknown", sourceState: "" };
  }
  const n = normState(raw);
  if (n === "executed") {
    return { kind: "executed", sourceState: raw };
  }
  if (n === "queued") {
    // 与文案一致称「Queued 阶段」；非「延迟已届满、链上 execute 必成功」的证明（无 ETA 字段）
    return { kind: "executable", sourceState: raw };
  }
  if (n === "pending" || n === "active" || n === "succeeded") {
    return { kind: "before_timelock", sourceState: raw };
  }
  if (n === "defeated" || n === "canceled" || n === "cancelled" || n === "expired") {
    return { kind: "not_executable", sourceState: raw };
  }
  return { kind: "unknown", sourceState: raw };
}

/** 阶段上已终结（Executed / 否决或取消等）；仍仅基于状态映射，无时间条件。 */
export function isGovernanceExecutionReadinessTerminal(readiness: GovernanceExecutionReadiness): boolean {
  return readiness.kind === "executed" || readiness.kind === "not_executable";
}

/**
 * 占位按钮是否「可点」（仍不发起交易）：仅当 readiness.kind 与 sourceState 与链上阶段一致时开启，
 * 不引入新推断；Queue 仅在 **Succeeded** 时占位可用，Execute 仅在 **Queued** 时占位可用。
 */
export function deriveExecutionActionSurface(readiness: GovernanceExecutionReadiness): {
  queueEnabled: boolean;
  executeEnabled: boolean;
} {
  if (readiness.kind === "executable") {
    return { queueEnabled: false, executeEnabled: true };
  }
  if (readiness.kind === "before_timelock" && normState(readiness.sourceState) === "succeeded") {
    return { queueEnabled: true, executeEnabled: false };
  }
  return { queueEnabled: false, executeEnabled: false };
}

/** 与 `GovernanceProposalExecutionReadinessPanel` / VoteFooter 共用 */
export function governanceExecReadinessDetailKey(
  readiness: GovernanceExecutionReadiness,
):
  | "governance_exec_readiness_detail_off_chain"
  | "governance_exec_shared_queued_explanation"
  | "governance_exec_readiness_detail_before_timelock"
  | "governance_exec_readiness_detail_executed"
  | "governance_exec_readiness_detail_not_executable"
  | "governance_exec_readiness_detail_unknown" {
  switch (readiness.kind) {
    case "off_chain_signal":
      return "governance_exec_readiness_detail_off_chain";
    case "executable":
      return "governance_exec_shared_queued_explanation";
    case "before_timelock":
      return "governance_exec_readiness_detail_before_timelock";
    case "executed":
      return "governance_exec_readiness_detail_executed";
    case "not_executable":
      return "governance_exec_readiness_detail_not_executable";
    default:
      return "governance_exec_readiness_detail_unknown";
  }
}

export const GOV_EXEC_READINESS_DESC_ID = "gov-exec-readiness-desc";
export const GOV_EXEC_READINESS_VOTE_FOOTER_ID = "gov-exec-readiness-vote-footer";
