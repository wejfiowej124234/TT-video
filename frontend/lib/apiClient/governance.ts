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
};

export type GovernanceVoteSemantics = {
  kind?: string;
  triggers_on_chain_execution?: boolean;
  weight_ssot?: string;
  anchor?: string;
};

export type GovernanceProposalDetailResponse = {
  status?: string;
  proposal?: GovernanceProposalDetail;
  vote_counts?: { yes?: number; no?: number; abstain?: number };
  governance_vote?: GovernanceVoteSemantics;
  my_vote?: string | null;
  /** B-092：已投时为本票冻结权重单位；未投为 null */
  my_vote_weight?: number | null;
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

export type GovernanceProposalVoteResult = {
  status?: string;
  proposal_id?: string;
  my_vote?: string;
  weight_applied?: number;
  idempotent?: boolean;
  duplicate?: boolean;
};

export type GovernanceVotingPowerResponse = {
  status?: string;
  authenticated?: boolean;
  vote_kind?: string;
  triggers_on_chain_execution?: boolean;
  weight_ssot?: string;
  anchor?: string;
  can_cast_vote?: boolean | null;
  reason?: string;
  delegate_to?: string | null;
  delegator_count?: number | null;
  total_weight_units?: number | null;
  note?: string;
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
