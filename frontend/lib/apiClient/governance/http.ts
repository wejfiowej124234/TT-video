import { apiUrl, routes } from "../../api";
import {
  getAuthHeaders,
  parseResponse,
  requestId,
  writeRequestHeaders,
  logApiJsonStatusNotOk,
  throwUnlessApiOk,
} from "../core";
import type {
  GovernanceProposalDetailResponse,
  GovernanceProposalStatusRead,
  GovernanceVotingPowerResponse,
  GovernanceProposalVoteResult,
} from "./types";

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
