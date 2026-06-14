import { describe, expect, it } from "vitest";
import {
  resolveStewardWorkbenchGateMode,
  resolveStewardWorkbenchHeaderSubtitleKey,
  resolveStewardStakePanelCollapseMode,
  shouldFetchStewardGovernanceData,
  shouldShowStewardGovernanceObservation,
  shouldUseStewardStakePanelCompact,
  stewardWorkbenchGateShowsTopCard,
} from "./stewardWorkbenchWorkspaceL5";

describe("stewardWorkbenchWorkspaceL5", () => {
  it("resolveStewardWorkbenchGateMode prioritizes B-track then A-track stake", () => {
    expect(
      resolveStewardWorkbenchGateMode({
        loading: false,
        bTrackLoading: false,
        appStatus: undefined,
        inRelease: false,
        chainStakeSummaryKey: "steward_workbench_stake_chain_summary_none",
        bTrackComplete: false,
      }),
    ).toBe("need_onboarding");
    expect(
      resolveStewardWorkbenchGateMode({
        loading: false,
        bTrackLoading: false,
        appStatus: "approved",
        inRelease: false,
        chainStakeSummaryKey: "steward_workbench_stake_chain_summary_pending",
        bTrackComplete: false,
      }),
    ).toBe("need_onboarding");
    expect(
      resolveStewardWorkbenchGateMode({
        loading: false,
        bTrackLoading: false,
        appStatus: "approved",
        inRelease: false,
        chainStakeSummaryKey: "steward_workbench_stake_chain_summary_pending",
        bTrackComplete: true,
      }),
    ).toBe("need_stake");
    expect(
      resolveStewardWorkbenchGateMode({
        loading: false,
        bTrackLoading: false,
        appStatus: "approved",
        inRelease: false,
        chainStakeSummaryKey: "steward_workbench_stake_chain_summary_staked",
        bTrackComplete: true,
      }),
    ).toBe("satisfied");
  });

  it("shouldShowStewardGovernanceObservation collapses when gate blocked", () => {
    expect(shouldShowStewardGovernanceObservation("need_onboarding")).toBe(false);
    expect(shouldShowStewardGovernanceObservation("need_stake")).toBe(false);
    expect(shouldShowStewardGovernanceObservation("satisfied")).toBe(true);
    expect(shouldShowStewardGovernanceObservation("none")).toBe(true);
  });

  it("shouldFetchStewardGovernanceData waits for manage and skips gated modes", () => {
    expect(
      shouldFetchStewardGovernanceData({
        workspaceUnlocked: true,
        manageLoading: true,
        gateMode: "satisfied",
      }),
    ).toBe(false);
    expect(
      shouldFetchStewardGovernanceData({
        workspaceUnlocked: true,
        manageLoading: false,
        gateMode: "need_stake",
      }),
    ).toBe(false);
    expect(
      shouldFetchStewardGovernanceData({
        workspaceUnlocked: true,
        manageLoading: false,
        gateMode: "satisfied",
      }),
    ).toBe(true);
  });

  it("header subtitle and top gate card follow gate mode", () => {
    expect(
      resolveStewardWorkbenchHeaderSubtitleKey({ gateMode: "need_stake" }),
    ).toBe("steward_workbench_subtitle_gate");
    expect(stewardWorkbenchGateShowsTopCard("need_onboarding")).toBe(true);
    expect(stewardWorkbenchGateShowsTopCard("satisfied")).toBe(false);
  });

  it("stake panel defers until #steward-ttg-stake anchor (L5 gate→action)", () => {
    expect(
      resolveStewardStakePanelCollapseMode({
        showTopGate: true,
        gateMode: "need_stake",
        stakeAnchorOpen: false,
      }),
    ).toBe("need_stake_deferred");
    expect(
      resolveStewardStakePanelCollapseMode({
        showTopGate: true,
        gateMode: "need_stake",
        stakeAnchorOpen: true,
      }),
    ).toBe("none");
    expect(shouldUseStewardStakePanelCompact({ gateMode: "need_stake", stakeAnchorOpen: true })).toBe(
      true,
    );
    expect(
      resolveStewardStakePanelCollapseMode({
        showTopGate: true,
        gateMode: "need_onboarding",
        stakeAnchorOpen: false,
      }),
    ).toBe("none");
  });
});
