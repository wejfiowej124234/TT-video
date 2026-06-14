import { describe, expect, it } from "vitest";
import {
  resolveStewardDualTrackSteps,
  shouldLockStewardWorkbenchTodo,
  stewardDualTrackProgressComplete,
  stewardDualTrackProgressVisible,
} from "./stewardWorkbenchDualTrackProgressModel";

describe("stewardWorkbenchDualTrackProgressModel", () => {
  it("resolveStewardDualTrackSteps marks A pay current when unpaid", () => {
    const steps = resolveStewardDualTrackSteps({
      admissionPaid: false,
      admissionComplete: false,
      chainStakeSummaryKey: "steward_workbench_stake_chain_summary_pending",
    });
    expect(steps.find((s) => s.id === "a_pay")?.visual).toBe("current");
    expect(steps.find((s) => s.id === "a_confirm")?.visual).toBe("pending");
    expect(steps.find((s) => s.id === "b_stake")?.visual).toBe("parallel");
  });

  it("resolveStewardDualTrackSteps marks A confirm current after paid", () => {
    const steps = resolveStewardDualTrackSteps({
      admissionPaid: true,
      admissionComplete: false,
      chainStakeSummaryKey: "steward_workbench_stake_chain_summary_pending",
    });
    expect(steps.find((s) => s.id === "a_pay")?.visual).toBe("complete");
    expect(steps.find((s) => s.id === "a_confirm")?.visual).toBe("current");
  });

  it("resolveStewardDualTrackSteps marks B stake current after A complete", () => {
    const steps = resolveStewardDualTrackSteps({
      admissionPaid: true,
      admissionComplete: true,
      chainStakeSummaryKey: "steward_workbench_stake_chain_summary_pending",
    });
    expect(steps.find((s) => s.id === "b_stake")?.visual).toBe("current");
  });

  it("stewardDualTrackProgressComplete requires A and B", () => {
    expect(
      stewardDualTrackProgressComplete({
        admissionComplete: true,
        chainStakeSummaryKey: "steward_workbench_stake_chain_summary_staked",
      }),
    ).toBe(true);
  });

  it("todo lock and progress visibility follow gate mode", () => {
    expect(shouldLockStewardWorkbenchTodo("need_onboarding")).toBe(true);
    expect(stewardDualTrackProgressVisible("satisfied")).toBe(false);
  });
});
