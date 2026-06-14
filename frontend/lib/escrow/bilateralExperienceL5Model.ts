/**
 * ① Escrow 双边确认体验 L5 — 聚合状态（等待对方 / 双方已确认）
 * SSOT：`BilateralConfirmBlock` · `escrow-bilateral-experience-l5.spec.ts`
 */
export const ESCROW_BILATERAL_EXPERIENCE_L5_FROZEN = true;

export type BilateralExperienceStatus = "pending_self" | "waiting_other" | "both_confirmed";

export function resolveBilateralExperienceStatus(input: {
  isGuide: boolean;
  touristConfirmed: boolean;
  guideConfirmed: boolean;
}): BilateralExperienceStatus {
  const { isGuide, touristConfirmed, guideConfirmed } = input;
  if (touristConfirmed && guideConfirmed) return "both_confirmed";
  const selfConfirmed = isGuide ? guideConfirmed : touristConfirmed;
  if (selfConfirmed) return "waiting_other";
  return "pending_self";
}

export function bilateralExperienceStatusI18nKey(
  status: BilateralExperienceStatus,
): string | null {
  if (status === "waiting_other") return "order_bilateralStatusWaitingOther";
  if (status === "both_confirmed") return "order_bilateralStatusBothConfirmed";
  return null;
}
