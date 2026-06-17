import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("stewardWorkbench (① · region operator UX)", () => {
  it("workbench wires gate, todo, governance, stake, cross nav, and UI freeze", () => {
    const main = read("app/governance/StewardRegionWorkbenchMain.tsx");
    expect(main).toContain("STEWARD_WORKBENCH_PAGE_L5_FROZEN_MARKER");
    expect(main).toContain("STEWARD_WORKBENCH_PAGE_L5_CLOSURE_PROBE");
    expect(main).toContain("StewardWorkbenchTodoSection");
    expect(main).toContain("StewardWorkbenchGovernanceSection");
    expect(main).not.toContain("StewardWorkbenchStatsSection");
    expect(main).toContain("meStewardWorkspaceUnlocked");
    expect(main).toContain("StewardWorkbenchL5CrossNav");
    expect(main).toContain("StewardWorkbenchStakingGateCard");
    expect(main).toContain("StewardWorkbenchBTrackAdmissionSection");
    expect(main).toContain("StewardWorkbenchBTrackCompleteStrip");
    expect(main).toContain("StewardWorkbenchDualTrackProgressCard");
    expect(main).toContain("useStewardOnboardingBTrack");
    expect(main).toContain("showTopGate && !showDualTrackProgress");
    expect(main).toContain("slimCompanion={slimAdmissionCompanion}");
    expect(main).toContain("lockedCompact={slimAdmissionCompanion}");
    expect(main).toContain("resolveStewardWorkbenchGateMode");
    expect(main).toContain("shouldFetchStewardGovernanceData");
    expect(main).toContain("hideDualTrackSummary");
    expect(main).toContain("gateCollapsed");
    expect(main).not.toContain("StewardWorkbenchFooter");
    expect(main).toContain('showMinimalFooter={false}');
    expect(main).not.toContain("provider_workbench");
    const progressIdx = main.indexOf("<StewardWorkbenchDualTrackProgressCard");
    const bTrackIdx = main.indexOf("StewardWorkbenchBTrackAdmissionSection");
    const bStripIdx = main.indexOf("StewardWorkbenchBTrackCompleteStrip");
    const stakeIdx = main.indexOf("<StewardWorkbenchTtgStakeSection");
    const todoIdx = main.indexOf("<StewardWorkbenchTodoSection");
    const govIdx = main.indexOf("<StewardWorkbenchGovernanceSection");
    expect(stakeIdx).toBeGreaterThan(0);
    expect(progressIdx).toBeGreaterThan(0);
    expect(stakeIdx).toBeGreaterThan(Math.max(bTrackIdx, bStripIdx));
    expect(todoIdx).toBeGreaterThan(stakeIdx);
    if (govIdx > 0) expect(govIdx).toBeGreaterThan(todoIdx);
  });

  it("pool and rewards sections support workspaceL5 variant tokens", () => {
    const pool = read("app/governance/GovernanceHubPoolSection.tsx");
    const rewards = read("app/governance/GovernanceHubRewardsSection.tsx");
    expect(pool).toContain("governanceHubSectionTokens");
    expect(pool).toContain('variant = "hub"');
    expect(rewards).toContain("governanceHubSectionTokens");
  });

  it("todo section links proposals delegate and distribution claim with API badge counts", () => {
    const todo = read("components/governance/StewardWorkbenchTodoSection.tsx");
    expect(todo).toContain("/governance/proposals?from=steward_workbench");
    expect(todo).toContain("data-tt-steward-todo-create-proposal");
    expect(todo).toContain("GOVERNANCE_PROPOSAL_CREATE_FROM_STEWARD_HREF");
    expect(todo).toContain("/governance/delegate?from=steward_workbench");
    expect(todo).toContain("/governance/distribution-claim?from=steward_workbench");
    expect(todo).toContain("data-tt-steward-todo-badge");
    expect(todo).toContain("formatStewardTodoBadgeValue");
    expect(read("app/governance/StewardRegionWorkbenchMain.tsx")).toContain("useStewardWorkbenchTodoCounts");
  });

  it("combined governance section is flat L5 with track summary hub in cross nav", () => {
    const section = read("components/governance/StewardWorkbenchGovernanceSection.tsx");
    expect(section).toContain("data-tt-steward-governance-combined");
    expect(section).not.toContain("<details");
    expect(section).not.toContain("GovernanceHubPoolSection");
    expect(section).not.toContain("data-tt-steward-open-governance-hub");
    expect(section).toContain("data-tt-steward-governance-tracks");
    expect(section).toContain("data-tt-steward-governance-claim-cta");
    expect(read("components/governance/StewardWorkbenchL5CrossNav.tsx")).toContain(
      "data-tt-steward-cross-nav-governance-hub",
    );
  });

  it("staking gate card shows dual-track CTAs for B and A tracks", () => {
    const gate = read("components/governance/StewardWorkbenchStakingGateCard.tsx");
    expect(gate).toContain("steward_workbench_staking_gate_cta_b_track");
    expect(gate).toContain("data-tt-steward-workbench-staking-gate-b-track");
    expect(gate).toContain("data-tt-steward-workbench-dual-track-status");
    expect(gate).toContain("onOpenStakePanel");
    expect(gate).toContain('type="button"');
    expect(gate).toContain("data-tt-steward-workbench-staking-gate-stake-anchor");
  });

  it("satisfied strip and A-track complete strip use view copy when B track is staked", () => {
    const satisfied = read("components/governance/StewardWorkbenchStakingSatisfiedStrip.tsx");
    expect(satisfied).toContain("steward_workbench_staking_view_section_cta");
    expect(satisfied).not.toContain("steward_workbench_staking_gate_cta_stake_section");
    const bStrip = read("components/governance/StewardWorkbenchBTrackCompleteStrip.tsx");
    expect(bStrip).toContain("bTrackStaked");
    expect(bStrip).toContain("steward_workbench_b_track_complete_strip_b_staked");
    expect(bStrip).toContain("steward_workbench_b_track_complete_strip_view_cta");
    expect(read("app/governance/StewardRegionWorkbenchMain.tsx")).toContain("isStewardChainStakeComplete");
  });

  it("todo section supports dual-track lock overlay", () => {
    const todo = read("components/governance/StewardWorkbenchTodoSection.tsx");
    expect(todo).toContain("data-tt-steward-workbench-todo-locked");
    expect(todo).toContain("steward_workbench_todo_locked_title");
    expect(todo).toContain("lockedCompact");
    expect(read("app/governance/StewardRegionWorkbenchMain.tsx")).toContain("locked={todoLocked}");
  });

  it("dual-track progress card replaces redundant gate card and disclosure", () => {
    const progress = read("components/governance/StewardWorkbenchDualTrackProgressCard.tsx");
    const model = read("lib/governance/stewardWorkbenchDualTrackProgressModel.ts");
    expect(progress).toContain("data-tt-steward-workbench-staking-gate");
    expect(progress).toContain("data-tt-steward-dual-track-stepper");
    expect(model).toContain('"a_pay"');
    expect(model).toContain('"b_stake"');
    expect(read("components/governance/StewardWorkbenchBTrackAdmissionSection.tsx")).toContain(
      "data-tt-steward-workbench-b-track-slim",
    );
    expect(read("components/governance/StewardWorkbenchAdmissionQuotePanel.tsx")).toContain(
      "data-tt-steward-admission-quote-panel",
    );
  });

  it("workbench includes TTG stake section and locked apply CTA", () => {
    const main = read("app/governance/StewardRegionWorkbenchMain.tsx");
    expect(main).toContain("StewardWorkbenchTtgStakeSection");
    expect(main).toContain("STEWARD_APPLY_HREF");
    const section = read("components/governance/StewardWorkbenchTtgStakeSection.tsx");
    expect(section).toContain("StewardTtgStakeManagePanel");
    const locked = read("components/workspace/WorkspaceOperatorLockedPanel.tsx");
    expect(locked).toContain("applyHref");
  });
});
