import type { RewardsRes } from "@/app/governance/governanceHubPageModel";
import { stewardRewardsItemCount } from "@/lib/governance/stewardWorkbenchGovernanceModel";

export type StewardWorkbenchTodoCounts = {
  proposals: number;
  delegate: number;
  claim: number;
};

export type StewardWorkbenchTodoCountsState = {
  counts: StewardWorkbenchTodoCounts | null;
  loading: boolean;
  dataSource: string | null;
};

export function countStewardTodoActiveProposals(
  items: ReadonlyArray<{ status?: string | null }> | null | undefined,
): number {
  if (!items?.length) return 0;
  return items.filter((item) => {
    const status = typeof item.status === "string" ? item.status.trim().toLowerCase() : "";
    return status === "active" || status === "pending";
  }).length;
}

/** ① 诚实计数：已设置委托 = 1（待管理/撤销），未设置 = 0 */
export function countStewardTodoDelegate(delegateTo: string | null | undefined): number {
  return typeof delegateTo === "string" && delegateTo.trim() ? 1 : 0;
}

export function countStewardTodoClaim(rewards: RewardsRes | null | undefined): number {
  return stewardRewardsItemCount(rewards ?? null);
}

export function formatStewardTodoBadgeValue(count: number | null | undefined, loading: boolean): string {
  if (loading || count == null) return "…";
  return String(count);
}

export function mergeStewardWorkbenchTodoCounts(input: {
  proposalItems: ReadonlyArray<{ status?: string | null }> | null | undefined;
  delegateTo: string | null | undefined;
  rewards: RewardsRes | null | undefined;
}): StewardWorkbenchTodoCounts {
  return {
    proposals: countStewardTodoActiveProposals(input.proposalItems),
    delegate: countStewardTodoDelegate(input.delegateTo),
    claim: countStewardTodoClaim(input.rewards),
  };
}
