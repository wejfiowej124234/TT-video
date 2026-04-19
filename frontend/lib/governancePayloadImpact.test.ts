import { describe, expect, it } from "vitest";
import { deriveGovernanceImpactTags, formatVotingPowerSnapshotForDisplay } from "./governancePayloadImpact";

describe("governancePayloadImpact (B-408)", () => {
  it("formats voting power snapshot display without changing structure", () => {
    const raw = {
      wallet: "0xabc",
      snapshot_block: "1",
      votes: "100",
      ssot: "GovernanceVotesToken.getPastVotes",
    };
    const s = formatVotingPowerSnapshotForDisplay(raw);
    expect(s).toContain("ERC20Votes.getPastVotes");
    expect(s).not.toContain("GovernanceVotesToken.getPastVotes");
  });

  it("deriveGovernanceImpactTags stays within API-visible facts", () => {
    const tags = deriveGovernanceImpactTags({
      onChainGovernor: true,
      chain: {
        governor_address: "0xgovernor",
        governance_token_address: "0xtoken",
      },
      hasCastVoteCalldata: true,
      operationId: "0xop",
    });
    expect(tags).toContain("execution_payload_api_boundary");
    expect(tags).toContain("identity_staking_separate");
    expect(tags).toContain("vote_cast_calldata");
  });

  it("returns no tags when off-chain governor", () => {
    expect(deriveGovernanceImpactTags({ onChainGovernor: false, hasCastVoteCalldata: false })).toEqual([]);
  });
});
