/**
 * B-072 / B-092：治理提案详情与链下投票（与 `GET/POST /api/v1/governance/proposals/...` 对齐；加权计票见 `governance_vote`）
 */

import { apiUrl, routes } from "../api";
import {
  getAuthHeaders,
  parseResponse,
  requestId,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "./core";

export type GovernanceProposalDetail = {
  id?: string;
  title?: string;
  body?: string;
  status?: string;
  /** Governor 索引模式：提案人地址 */
  proposer?: string | null;
  snapshot_block?: number;
  vote_start_block?: number;
  vote_end_block?: number;
  /** ProposalQueued 同源 operationId（bytes32 十六进制）；未排队时为 null */
  operation_id?: string | null;
};

export type GovernanceVoteSemantics = {
  kind?: string;
  triggers_on_chain_execution?: boolean;
  weight_ssot?: string;
  anchor?: string;
};

export type GovernanceProposalChainSnapshot = {
  governor_address?: string;
  governance_token_address?: string | null;
  state_live?: string | null;
  state_rpc_error?: string | null;
  projection_state?: string | null;
};

export type GovernanceCastVoteCalldata = {
  yes?: string | null;
  no?: string | null;
  abstain?: string | null;
  selector_note?: string;
};

export type GovernanceProposalDetailResponse = {
  status?: string;
  proposal?: GovernanceProposalDetail;
  /** 链上模式为大整数字符串；MVP 为 number */
  vote_counts?: { yes?: number | string; no?: number | string; abstain?: number | string };
  governance_vote?: GovernanceVoteSemantics;
  my_vote?: string | null;
  /** B-092：已投时为本票冻结权重单位；未投为 null */
  my_vote_weight?: number | null;
  chain?: GovernanceProposalChainSnapshot;
  voting_power_at_snapshot?: unknown;
  cast_vote_calldata?: GovernanceCastVoteCalldata;
};

export async function getGovernanceProposal(proposalId: string): Promise<GovernanceProposalDetailResponse> {
  const id = proposalId.trim();
  const res = await fetch(apiUrl(routes.governanceProposal(id)), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as GovernanceProposalDetailResponse;
  logApiJsonStatusNotOk("getGovernanceProposal", data);
  throwUnlessApiOk(data);
  return data;
}

/** `GET …/proposal-status` 成功体（列表批量并行用；`data_source` / `note` 与后端投影径一致时才有） */
export type GovernanceProposalStatusRead = {
  status: string;
  is_chain_ssot: boolean;
  data_source?: string;
  note?: string;
};

/**
 * `GET /api/v1/governance/proposal-status/:id` — 只读。
 * 与 proposals 列表批量刷新一致：**非 2xx**、**JSON 不可解析**、**缺 `status` / `is_chain_ssot`**、**网络错误** → **`null`**（不抛，不打断并行）。
 */
export async function getGovernanceProposalStatus(proposalId: string): Promise<GovernanceProposalStatusRead | null> {
  const id = proposalId.trim();
  if (!id) return null;
  try {
    const res = await fetch(apiUrl(routes.governanceProposalStatus(id)), {
      headers: { "x-request-id": requestId() },
    });
    let j: Record<string, unknown>;
    try {
      j = (await res.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
    if (!res.ok) return null;
    if (typeof j.status === "string" && typeof j.is_chain_ssot === "boolean") {
      const out: GovernanceProposalStatusRead = {
        status: j.status,
        is_chain_ssot: j.is_chain_ssot,
      };
      if (typeof j.data_source === "string" && j.data_source.trim()) {
        out.data_source = j.data_source.trim();
      }
      if (typeof j.note === "string" && j.note.trim()) {
        out.note = j.note.trim();
      }
      return out;
    }
    return null;
  } catch {
    return null;
  }
}

export type GovernanceProposalVoteResult = {
  status?: string;
  proposal_id?: string;
  my_vote?: string;
  weight_applied?: number;
  idempotent?: boolean;
  duplicate?: boolean;
};

/** B-098：`f(wallet,B)=GovernanceVotesToken.getPastVotes`；与提案详情 `voting_power_at_snapshot` 同源 `eth_call` */
export type GovernanceOnChainVoteWeight = {
  anchor?: string;
  weight_formula_id?: string;
  formula?: string;
  snapshot_block?: number | null;
  votes_u256_dec?: string | null;
  read_status?: string;
  error?: string | null;
  ssot?: string;
  eth_call_note?: string;
  wallet?: string;
  governance_token_address?: string;
  reconcile?: {
    delegation_total_weight_units_mvp?: number | null;
    mvp_numeric_equal_to_chain_votes?: boolean | null;
    note?: string;
  };
};

/** B-092 Completion **110**：`GET …/voting-power?snapshot_block=` 时各份额代币 `balanceOf` 链上读数 */
export type GovernanceCountryPoolShareSnapshotToken = {
  token_address?: string;
  balance_u256_hex?: string | null;
  read_status?: string;
  error?: string | null;
};

export type GovernanceCountryPoolShareSnapshot = {
  block?: number | null;
  read_status?: string;
  tokens?: GovernanceCountryPoolShareSnapshotToken[];
  error?: string | null;
  reconcile?: { delegation_units_mvp?: number | null; note?: string };
  anchor?: string;
};

export type GovernanceVotingPowerResponse = {
  status?: string;
  authenticated?: boolean;
  vote_kind?: string;
  triggers_on_chain_execution?: boolean;
  weight_ssot?: string;
  anchor?: string;
  /** B-098 */
  weight_formula_anchor?: string;
  /** B-098：与 `on_chain_vote_weight.votes_u256_dec` 同值（`read_status===ok` 时） */
  unified_on_chain_vote_weight_u256_dec?: string | null;
  on_chain_vote_weight?: GovernanceOnChainVoteWeight;
  can_cast_vote?: boolean | null;
  reason?: string;
  delegate_to?: string | null;
  delegator_count?: number | null;
  total_weight_units?: number | null;
  note?: string;
  stake_snapshot?: unknown;
  country_pool_share_snapshot?: GovernanceCountryPoolShareSnapshot;
};

export async function getGovernanceVotingPower(): Promise<GovernanceVotingPowerResponse> {
  const res = await fetch(apiUrl(routes.governanceVotingPower), {
    headers: { "x-request-id": requestId(), ...getAuthHeaders() },
  });
  const data = (await parseResponse(res)) as GovernanceVotingPowerResponse;
  logApiJsonStatusNotOk("getGovernanceVotingPower", data);
  throwUnlessApiOk(data);
  return data;
}

export async function postGovernanceProposalVote(
  proposalId: string,
  vote: "yes" | "no" | "abstain",
  idempotencyKey?: string
): Promise<GovernanceProposalVoteResult> {
  const id = proposalId.trim();
  const res = await fetch(apiUrl(routes.governanceProposalVote(id)), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...writeRequestHeaders(idempotencyKey),
    },
    body: JSON.stringify({ vote }),
  });
  const data = (await parseResponse(res)) as GovernanceProposalVoteResult;
  logApiJsonStatusNotOk("postGovernanceProposalVote", data);
  throwUnlessApiOk(data);
  return data;
}
