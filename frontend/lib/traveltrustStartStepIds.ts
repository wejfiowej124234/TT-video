/** #start 三步 ID（P2-B · lib SSOT · 非视觉） */
export const TRAVELTRUST_START_L5_STEP_IDS = ["plan", "match", "escrow"] as const;

export type TraveltrustStartL5StepId = (typeof TRAVELTRUST_START_L5_STEP_IDS)[number];

export function resolveTraveltrustStartStepIndex(stepId: TraveltrustStartL5StepId | null | undefined): number {
  if (!stepId) return 0;
  const idx = TRAVELTRUST_START_L5_STEP_IDS.indexOf(stepId);
  return idx >= 0 ? idx : 0;
}

export function isTraveltrustStartL5StepId(value: string | null | undefined): value is TraveltrustStartL5StepId {
  return Boolean(value && (TRAVELTRUST_START_L5_STEP_IDS as readonly string[]).includes(value));
}
