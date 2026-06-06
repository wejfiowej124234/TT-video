/**
 * **治理提案 / 投票 / 投票权**（**B-072** / **B-092** / **B-098**；**`crates/api/src/routes/governance_proposals/`**、**`governance_voting_power/`**；**04** §三）。
 *
 * **分岔与订单域不同**：**不**以 **`chain_off_unavailable` 503** 作为统一门禁；存在 **Governor+DB 投影**、**链上 `eth_call`**、**`chain_off_mvp` 内存票仓** 等多模式（响应头 **`x-implementation-status`**、体 **`data_source`** / **`governance_vote.weight_ssot`** 等见实现）。
 * **`GET …/voting-power`**：**始终 2xx（200）**；未登录 → **`authenticated:false`**、**`can_cast_vote:null`**、**`note`**；已登录且正委托给他人 → **`can_cast_vote:false`**、**`reason: delegation_active_cannot_vote`**（**HTTP 仍为 200**，与 **`POST …/vote`** 在同状态下返回 **403** 不同）。
 * **`GET …/proposals/:id`**：详情在 Governor 模式与 MVP 下均可能 **404** **`proposal_not_found`**、**400** **`invalid_proposal_id`** 等；**502/503** 见实现（**`parseResponse`** 抛 **`request_failed_*` 或网关体**）。
 * **`GET …/proposal-status/:id`**：可能 **502/503**（如 **`governor_state_unavailable` / `governor_state_unconfigured`**）；本客户端 **`getGovernanceProposalStatus`** 对非 **2xx** 返回 **`null`**（不抛）。
 * **`POST …/vote`**：**401** **`login_required`**；**400** **`invalid_vote`** / **`invalid_proposal_id`**；**Governor 索引模式** → **400** **`vote_on_chain_required`**（体含 **`cast_vote_calldata`**）；已委托 → **403** **`delegation_active_cannot_vote`**；未知提案 → **404** **`proposal_not_found`**；改票 → **409** **`already_voted`**；同票重复 → **200** **`idempotent:true`**。
 */

export type {
  GovernanceProposalDetail,
  GovernanceVoteSemantics,
  GovernanceProposalChainSnapshot,
  GovernanceCastVoteCalldata,
  GovernanceProposalDetailResponse,
  GovernanceProposalStatusRead,
  GovernanceProposalVoteResult,
  GovernanceOnChainVoteWeight,
  GovernanceCountryPoolShareSnapshotToken,
  GovernanceCountryPoolShareSnapshot,
  GovernanceVotingPowerResponse,
} from "./types";
export {
  getGovernanceProposal,
  getGovernanceProposalStatus,
  getGovernanceVotingPower,
  postGovernanceProposalVote,
} from "./http";
