import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_STARTER_PROPOSAL_IDS,
  isGovernanceStarterProposalId,
  resolveGovernanceProposalDisplayBody,
  resolveGovernanceProposalDisplayTitle,
} from "./governanceStarterProposalDisplay";

const t = (key: string) => key;

describe("governanceStarterProposalDisplay", () => {
  it("maps starter UUIDs to locale keys", () => {
    expect(isGovernanceStarterProposalId(GOVERNANCE_STARTER_PROPOSAL_IDS.feeRouterParams)).toBe(true);
    expect(resolveGovernanceProposalDisplayTitle(GOVERNANCE_STARTER_PROPOSAL_IDS.feeRouterParams, "old", t)).toBe(
      "governance_starter_proposal_1_title",
    );
    expect(resolveGovernanceProposalDisplayBody(GOVERNANCE_STARTER_PROPOSAL_IDS.treasuryRotation, "old", t)).toBe(
      "governance_starter_proposal_2_body",
    );
  });

  it("falls back to API copy for non-starter proposals", () => {
    expect(resolveGovernanceProposalDisplayTitle("42", "Custom title", t)).toBe("Custom title");
    expect(resolveGovernanceProposalDisplayBody("42", "Custom body", t)).toBe("Custom body");
  });
});
