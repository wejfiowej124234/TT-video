import type { OnboardingEntitlementsView } from "@/lib/me/meOnboardingViewModel";
import {
  onboardingEntitlementPaidForRole,
  onboardingRoleConfirmedForQuote,
} from "@/lib/me/meOnboardingViewModel";

/** B 轨 · 区域主理人 USDC 准入费是否已 paid/active */
export function isStewardBTrackPaid(
  entitlements: OnboardingEntitlementsView | null | undefined,
): boolean {
  return onboardingEntitlementPaidForRole(entitlements, "region_steward");
}

/**
 * Track A closed for workbench gate (V65-PROD-003 · G088).
 * Owner REMOVE: TT ledger USDC admission fee is not required —
 * complete = role-confirm (or users.role=region_steward).
 * `entitlements` kept for call-site compatibility / legacy paid echo.
 */
export function isStewardBTrackComplete(input: {
  entitlements: OnboardingEntitlementsView | null | undefined;
  mePayload: unknown;
}): boolean {
  void input.entitlements;
  return onboardingRoleConfirmedForQuote(input.mePayload, "region_steward");
}

/** A 轨准入区（整段 · 兼容旧锚点 id） */
export const STEWARD_B_TRACK_ADMISSION_ANCHOR = "steward-b-track-admission";
/** A1 · 创建订单 + 钱包付 USDC */
export const STEWARD_A_TRACK_PAYMENT_ANCHOR = "steward-a-track-payment";
/** A2 · 确认区域主理人身份 */
export const STEWARD_A_TRACK_CONFIRM_ANCHOR = "steward-a-track-confirm";
