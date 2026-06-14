import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS,
  GOVERNANCE_PROPOSALS_L5_ENTERPRISE_AUDIT_SCORE_PHASE1,
  GOVERNANCE_PROPOSALS_L5_OPEN_P0,
  GOVERNANCE_PROPOSALS_L5_OPEN_P1,
  GOVERNANCE_PROPOSALS_L5_UI_FROZEN,
} from "./governanceProposalsL5ClosureSprintModel";
import {
  governanceProposalsListHref,
} from "./governanceProposalsNavModel";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("governance proposals L5 closure (① · steward publish corridor)", () => {
  it("① P0/P1 closed with no open findings", () => {
    expect(GOVERNANCE_PROPOSALS_L5_OPEN_P0).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_OPEN_P1).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_CLOSURE_FINDINGS.filter((f) => f.status === "open")).toHaveLength(0);
    expect(GOVERNANCE_PROPOSALS_L5_ENTERPRISE_AUDIT_SCORE_PHASE1).toBe(100);
    expect(GOVERNANCE_PROPOSALS_L5_UI_FROZEN).toBe(true);
  });

  it("steward workbench wires create proposal CTA", () => {
    const todo = read("components/governance/StewardWorkbenchTodoSection.tsx");
    expect(todo).toContain("data-tt-steward-todo-create-proposal");
    expect(todo).toContain("GOVERNANCE_PROPOSAL_CREATE_FROM_STEWARD_HREF");
  });

  it("create and detail pages use subpage nav with steward back link", () => {
    const create = read("app/governance/proposals/new/GovernanceProposalCreatePageMain.tsx");
    const detail = read("app/governance/proposals/[id]/GovernanceProposalDetailPageMain.tsx");
    const nav = read("components/governance/GovernanceProposalsSubpageNav.tsx");
    expect(nav).toContain("StewardWorkbenchSubpageBackLinkFromQuery");
    expect(nav).toContain("data-tt-governance-proposals-list-back");
    expect(create).toContain("GovernanceProposalsSubpageNav");
    expect(detail).toContain("GovernanceProposalsSubpageNav");
  });

  it("preserves from=steward_workbench in list href helper", () => {
    expect(governanceProposalsListHref("steward_workbench")).toBe(
      "/governance/proposals?from=steward_workbench",
    );
    expect(governanceProposalsListHref(null)).toBe("/governance/proposals");
  });

  it("playwright create L5 spec and smoke script exist", () => {
    expect(read("e2e/governance-proposal-create-l5.spec.ts")).toContain(
      "data-tt-governance-proposal-create-page",
    );
    const smoke = read("../scripts/dev/smoke-governance-proposals-l5-local.sh");
    expect(smoke).toContain("governanceProposalsL5FullClosure.contract.test.ts");
    expect(smoke).toContain("governance-proposals-full-l5.spec.ts");
    expect(smoke).toContain("governance-proposal-create-l5.spec.ts");
    expect(smoke).toContain("TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK");
  });

  it("industry wallet L5: connect panel, chain gate, timelock writes, multi-action", () => {
    expect(read("components/governance/GovernanceWalletConnectPanel.tsx")).toContain(
      "data-tt-governance-wallet-connect-panel",
    );
    expect(read("components/governance/GovernanceChainMismatchActions.tsx")).toContain("useSwitchChain");
    expect(read("dapp/hooks/useGovernanceWalletGate.ts")).toContain("getPastVotes");
    expect(read("dapp/hooks/useGovernanceTimelockActions.ts")).toContain('functionName: "queue"');
    expect(read("dapp/hooks/useGovernanceCancelProposal.ts")).toContain('functionName: "cancel"');
    expect(read("components/governance/GovernanceProposalExecutionActionsPanel.tsx")).toContain(
      "data-tt-governance-exec-actions-panel",
    );
    expect(read("components/governance/GovernanceProposalCreateWizard.tsx")).toContain(
      "data-tt-governance-propose-add-action",
    );
    expect(read("lib/governance/governanceProposalTemplateCalldata.ts")).toContain(
      "buildGovernanceTemplateActionPreset",
    );
    expect(read("lib/governance/travelTrustGovernorAbi.ts")).toContain('"queue"');
    const detail = read("app/governance/proposals/[id]/GovernanceProposalDetailLoadedArticle.tsx");
    expect(detail).toContain("GovernanceProposalExecutionActionsPanel");
    expect(detail).toContain("GovernanceProposalCancelPanel");
    expect(detail).toContain("governance_voting_power_onchain_snapshot");
    expect(read("components/governance/GovernanceOnChainVotePanel.tsx")).toContain("GovernanceTxExplorerLink");
  });

  it("no dead ExecutionActionsSkeleton component", () => {
    expect(() => read("components/governance/GovernanceProposalExecutionActionsSkeleton.tsx")).toThrow();
  });
});
