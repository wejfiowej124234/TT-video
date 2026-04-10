import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import GovernanceProposalExecutionReadinessPanel, {
  GovernanceProposalExecutionVoteFooter,
} from "./GovernanceProposalExecutionReadinessPanel";
import { deriveGovernanceExecutionReadiness } from "@/lib/governanceExecutionReadiness";

vi.mock("@/components/LocaleProvider", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe("GovernanceProposalExecutionReadinessPanel", () => {
  it("shows off-chain detail when not on-chain governor", () => {
    render(<GovernanceProposalExecutionReadinessPanel onChainGovernor={false} chain={{ state_live: "active" }} />);
    expect(screen.getByText("governance_exec_readiness_section_heading")).toBeTruthy();
    expect(screen.getByText("governance_exec_readiness_detail_off_chain")).toBeTruthy();
  });

  it("shows executable detail when queued on-chain", () => {
    render(<GovernanceProposalExecutionReadinessPanel onChainGovernor chain={{ state_live: "queued" }} />);
    expect(screen.getByText("governance_exec_shared_queued_explanation")).toBeTruthy();
    expect(screen.getByText("queued")).toBeTruthy();
  });
});

describe("GovernanceProposalExecutionVoteFooter", () => {
  it("renders nothing when off-chain", () => {
    const { container } = render(
      <GovernanceProposalExecutionVoteFooter
        readiness={deriveGovernanceExecutionReadiness(false, { state_live: "queued" })}
        onChainGovernor={false}
      />,
    );
    expect(container.textContent).toBe("");
  });

  it("repeats state-specific detail for on-chain", () => {
    const readiness = deriveGovernanceExecutionReadiness(true, { state_live: "executed" });
    render(<GovernanceProposalExecutionVoteFooter readiness={readiness} onChainGovernor />);
    expect(screen.getByText("governance_exec_readiness_vote_buttons_readonly_lead")).toBeTruthy();
    expect(screen.getByText("governance_exec_readiness_detail_executed")).toBeTruthy();
  });
});
