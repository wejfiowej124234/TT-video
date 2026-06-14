import type { StewardWorkbenchGateMode } from "@/lib/governance/stewardWorkbenchWorkspaceL5";

export type StewardDualTrackStepId = "a_pay" | "a_confirm" | "b_stake";

export type StewardDualTrackStepVisual = "complete" | "current" | "pending" | "parallel";

export type StewardDualTrackStepView = {
  id: StewardDualTrackStepId;
  visual: StewardDualTrackStepVisual;
  labelKey: string;
  anchorId: string;
};

import {
  STEWARD_A_TRACK_CONFIRM_ANCHOR,
  STEWARD_A_TRACK_PAYMENT_ANCHOR,
} from "@/lib/steward/stewardBTrackModel";

const STEWARD_STAKE_ANCHOR = "steward-ttg-stake";

/** 双轨进度：A 轨 USDC（A1→A2）→ B 轨 TTG 质押（可与 A 并行） */
export function resolveStewardDualTrackSteps(input: {
  admissionPaid: boolean;
  admissionComplete: boolean;
  chainStakeSummaryKey: string;
}): StewardDualTrackStepView[] {
  const bStaked = input.chainStakeSummaryKey === "steward_workbench_stake_chain_summary_staked";

  const aPayVisual: StewardDualTrackStepVisual = input.admissionPaid
    ? "complete"
    : bStaked
      ? "parallel"
      : "current";
  const aConfirmVisual: StewardDualTrackStepVisual = input.admissionComplete
    ? "complete"
    : input.admissionPaid
      ? "current"
      : "pending";
  const bStakeVisual: StewardDualTrackStepVisual = bStaked
    ? "complete"
    : input.admissionComplete
      ? "current"
      : "parallel";

  return [
    {
      id: "a_pay",
      visual: aPayVisual,
      labelKey: "steward_workbench_dual_track_step_a_pay_label",
      anchorId: STEWARD_A_TRACK_PAYMENT_ANCHOR,
    },
    {
      id: "a_confirm",
      visual: aConfirmVisual,
      labelKey: "steward_workbench_dual_track_step_a_confirm_label",
      anchorId: STEWARD_A_TRACK_CONFIRM_ANCHOR,
    },
    {
      id: "b_stake",
      visual: bStakeVisual,
      labelKey: "steward_workbench_dual_track_step_b_stake_label",
      anchorId: STEWARD_STAKE_ANCHOR,
    },
  ];
}

export function stewardDualTrackProgressComplete(input: {
  admissionComplete: boolean;
  chainStakeSummaryKey: string;
}): boolean {
  return (
    input.admissionComplete &&
    input.chainStakeSummaryKey === "steward_workbench_stake_chain_summary_staked"
  );
}

export function shouldLockStewardWorkbenchTodo(gateMode: StewardWorkbenchGateMode): boolean {
  return gateMode === "need_onboarding" || gateMode === "need_stake";
}

export function stewardDualTrackProgressVisible(gateMode: StewardWorkbenchGateMode): boolean {
  return gateMode === "need_onboarding" || gateMode === "need_stake";
}
