/** 首页入口加载里程碑（纯逻辑 · 无 React） */
export const TRAVELTRUST_HOME_ENTRY_MILESTONES = [
  "shell",
  "brief",
  "cinematic",
  "hero",
  "sections",
] as const;

export type TraveltrustHomeEntryMilestoneId = (typeof TRAVELTRUST_HOME_ENTRY_MILESTONES)[number];

export const TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS: Record<TraveltrustHomeEntryMilestoneId, number> = {
  shell: 12,
  brief: 23,
  cinematic: 38,
  hero: 17,
  sections: 10,
};

export function computeTraveltrustHomeEntryProgress(done: ReadonlySet<TraveltrustHomeEntryMilestoneId>): number {
  let sum = 0;
  for (const id of TRAVELTRUST_HOME_ENTRY_MILESTONES) {
    if (done.has(id)) sum += TRAVELTRUST_HOME_ENTRY_MILESTONE_WEIGHTS[id];
  }
  return Math.min(100, Math.max(0, sum));
}

export function isTraveltrustHomeEntryComplete(done: ReadonlySet<TraveltrustHomeEntryMilestoneId>): boolean {
  return TRAVELTRUST_HOME_ENTRY_MILESTONES.every((id) => done.has(id));
}
