import type { MeIdentitySlotId, MeIdentitySlotState } from "@/lib/meIdentitySlots";

/** Hub 申请卡 `surfaceId` → `identity_slots` id */
export const ME_IDENTITIES_HUB_SLOT_BY_SURFACE: Record<string, MeIdentitySlotId> = {
  guide: "guide",
  provider: "merchant",
  acquisition: "acquisition",
  steward: "region_steward",
};

export function meIdentitiesHubSlotState(
  surfaceId: string,
  slotById: (id: MeIdentitySlotId) => { state: MeIdentitySlotState } | null,
): MeIdentitySlotState | null {
  const slotId = ME_IDENTITIES_HUB_SLOT_BY_SURFACE[surfaceId];
  if (!slotId) return null;
  const row = slotById(slotId);
  if (!row || row.state === "inactive") return null;
  return row.state;
}

/** 核心身份卡 CTA：未开通 → 申请；已开通/审核中 → 准入费 onboarding */
export function meIdentitiesCoreIdentityHref(
  surfaceId: "provider" | "steward",
  slotState: MeIdentitySlotState | null,
  applyHref: string,
  onboardingHref: string,
): string {
  if (surfaceId === "provider" && (slotState === "pending" || slotState === "active" || slotState === "restricted")) {
    return onboardingHref;
  }
  if (surfaceId === "steward" && (slotState === "pending" || slotState === "active" || slotState === "restricted")) {
    return onboardingHref;
  }
  return applyHref;
}
