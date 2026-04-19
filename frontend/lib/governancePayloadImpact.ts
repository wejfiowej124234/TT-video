/**
 * B-408：治理详情「影响标签 / 时间轴」与 API 已暴露字段同源；不臆造未索引的 execution targets。
 */

import type { GovernanceProposalChainSnapshot } from "@/lib/apiClient/governance";

/** 与 i18n `governance_impact_tag_*` 键一一对应 */
export type GovernanceImpactTagId =
  | "vote_cast_calldata"
  | "weight_past_votes_snapshot"
  | "governor_contract"
  | "governance_token_weight"
  | "timelock_operation"
  | "execution_payload_api_boundary"
  | "identity_staking_separate";

const LEGACY_SSOT_SUBSTR = "GovernanceVotesToken.getPastVotes";

/**
 * 展示用：将详情 `voting_power_at_snapshot` JSON 中的遗留 API 字面替换为产品真值说明（不改变数据语义）。
 */
export function formatVotingPowerSnapshotForDisplay(raw: unknown): string {
  try {
    const s = JSON.stringify(raw, null, 2);
    return s
      .split(LEGACY_SSOT_SUBSTR)
      .join("ERC20Votes.getPastVotes (@ governance_token / GET /meta chain.contracts.governance_token_address)");
  } catch {
    return String(raw);
  }
}

export function deriveGovernanceImpactTags(params: {
  onChainGovernor: boolean;
  chain?: GovernanceProposalChainSnapshot | null;
  hasCastVoteCalldata: boolean;
  operationId?: string | null;
}): GovernanceImpactTagId[] {
  if (!params.onChainGovernor) return [];

  const out: GovernanceImpactTagId[] = [];

  out.push("identity_staking_separate");

  if (params.hasCastVoteCalldata) {
    out.push("vote_cast_calldata");
  }

  const tok = params.chain?.governance_token_address?.trim();
  if (tok) {
    out.push("governance_token_weight");
    out.push("weight_past_votes_snapshot");
  }

  const gov = params.chain?.governor_address?.trim();
  if (gov) {
    out.push("governor_contract");
  }

  const op = params.operationId?.trim();
  if (op) {
    out.push("timelock_operation");
  }

  out.push("execution_payload_api_boundary");

  return out;
}

export function impactTagI18nKey(id: GovernanceImpactTagId): string {
  const map: Record<GovernanceImpactTagId, string> = {
    vote_cast_calldata: "governance_impact_tag_vote_cast",
    weight_past_votes_snapshot: "governance_impact_tag_weight_snapshot",
    governor_contract: "governance_impact_tag_governor",
    governance_token_weight: "governance_impact_tag_governance_token",
    timelock_operation: "governance_impact_tag_timelock_op",
    execution_payload_api_boundary: "governance_impact_tag_exec_api_boundary",
    identity_staking_separate: "governance_impact_tag_identity_staking",
  };
  return map[id];
}
