import { stewardSeatInReleasePhase } from "@/lib/steward/stewardSeatModel";
import type { StewardSeatView } from "@/lib/steward/stewardSeatModel";

/** 主理人工作台门闸态（对齐商家/向导 L5 IA） */
export type StewardWorkbenchGateMode = "none" | "need_onboarding" | "need_stake" | "satisfied";

const NEED_STAKE_CHAIN_KEYS = new Set([
  "steward_workbench_stake_chain_summary_pending",
  "steward_workbench_stake_chain_summary_partial",
  "steward_workbench_stake_chain_summary_connect",
  "steward_workbench_stake_chain_summary_wallet_mismatch",
  "steward_workbench_stake_chain_summary_reading",
  "steward_workbench_stake_chain_summary_none",
]);

export function resolveStewardWorkbenchGateMode(input: {
  loading: boolean;
  bTrackLoading: boolean;
  appStatus: string | undefined;
  inRelease: boolean;
  chainStakeSummaryKey: string;
  bTrackComplete: boolean;
}): StewardWorkbenchGateMode {
  if (input.loading || input.bTrackLoading || input.inRelease) return "none";
  if (!input.appStatus) return "need_onboarding";
  if (!input.bTrackComplete) return "need_onboarding";
  if (input.chainStakeSummaryKey === "steward_workbench_stake_chain_summary_staked") {
    return "satisfied";
  }
  if (NEED_STAKE_CHAIN_KEYS.has(input.chainStakeSummaryKey)) return "need_stake";
  return "none";
}

export function stewardWorkbenchInRelease(seat: StewardSeatView | null): boolean {
  return stewardSeatInReleasePhase(seat);
}

/** 区域治理观测：门闸未过时折叠（占位仅在顶部门闸卡） */
export function shouldShowStewardGovernanceObservation(gateMode: StewardWorkbenchGateMode): boolean {
  return gateMode !== "need_onboarding" && gateMode !== "need_stake";
}

export function resolveStewardWorkbenchHeaderSubtitleKey(input: {
  gateMode: StewardWorkbenchGateMode;
}): "steward_workbench_subtitle_gate" | "steward_workbench_subtitle" {
  if (input.gateMode === "need_onboarding" || input.gateMode === "need_stake") {
    return "steward_workbench_subtitle_gate";
  }
  return "steward_workbench_subtitle";
}

export function stewardWorkbenchGateShowsTopCard(gateMode: StewardWorkbenchGateMode): boolean {
  return gateMode === "need_onboarding" || gateMode === "need_stake";
}

/** 门闸/质押态未就绪时不拉 pool/rewards（避免隐藏区块仍请求） */
export function shouldFetchStewardGovernanceData(input: {
  workspaceUnlocked: boolean;
  manageLoading: boolean;
  gateMode: StewardWorkbenchGateMode;
}): boolean {
  if (!input.workspaceUnlocked || input.manageLoading) return false;
  return shouldShowStewardGovernanceObservation(input.gateMode);
}

/** 质押面板折叠态（L5 · 门闸引导 → 锚点展开，对齐 DeFi 工作台 gate→action 分轨） */
export type StewardStakePanelCollapseMode = "none" | "onboarding" | "need_stake_deferred";

export function resolveStewardStakePanelCollapseMode(input: {
  showTopGate: boolean;
  gateMode: StewardWorkbenchGateMode;
  stakeAnchorOpen: boolean;
}): StewardStakePanelCollapseMode {
  if (!input.showTopGate) return "none";
  // 双轨并行：B 轨未完成时仍展开 A 轨质押区（同时收取）
  if (input.gateMode === "need_onboarding") return "none";
  if (input.gateMode === "need_stake" && !input.stakeAnchorOpen) return "need_stake_deferred";
  return "none";
}

export function shouldCollapseStewardStakePanel(mode: StewardStakePanelCollapseMode): boolean {
  return mode !== "none";
}

/** need_stake 锚点展开后仍用紧凑操作面（无双轨瓦片/生命周期冗块） */
export function shouldUseStewardStakePanelCompact(input: {
  gateMode: StewardWorkbenchGateMode;
  stakeAnchorOpen: boolean;
}): boolean {
  return input.gateMode === "need_stake" && input.stakeAnchorOpen;
}

export { shouldLockStewardWorkbenchTodo, stewardDualTrackProgressVisible } from "./stewardWorkbenchDualTrackProgressModel";

export function stewardStakePanelCollapsedHintKey(mode: StewardStakePanelCollapseMode): string | null {
  if (mode === "onboarding") return "steward_workbench_stake_gate_collapsed_hint";
  if (mode === "need_stake_deferred") return "steward_workbench_stake_gate_collapsed_hint_need_stake";
  return null;
}
