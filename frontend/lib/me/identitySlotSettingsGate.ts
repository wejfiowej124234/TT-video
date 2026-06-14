/** API GET profile fields that mirror PATCH gate (slot_rbac · ①). */
export type IdentitySlotPatchGateFields = {
  slot_state?: string | null;
  profile_patch_allowed?: boolean | null;
  /** Acquisition legacy alias; kept in sync with `slot_state` on GET. */
  acquisition_slot_state?: string | null;
  /** Guide / merchant / steward application status when gate bool omitted. */
  application_status?: string | null;
  /** Legacy guides row status (fallback). */
  status?: string | null;
};

function identitySlotStatusImpliesPatchAllowed(status: string | null | undefined): boolean {
  const normalized = status?.trim().toLowerCase() ?? "";
  return normalized === "active" || normalized === "approved";
}

function resolveIdentitySlotStateFromProfile(
  profile: IdentitySlotPatchGateFields,
  patchAllowed: boolean,
): string {
  return (
    profile.slot_state?.trim() ||
    profile.acquisition_slot_state?.trim() ||
    (patchAllowed ? "active" : "inactive")
  );
}

export function resolveIdentityProfilePatchGate(
  profile: IdentitySlotPatchGateFields | null | undefined,
): { slotState: string; patchAllowed: boolean } {
  if (!profile) {
    return { slotState: "inactive", patchAllowed: false };
  }
  if (typeof profile.profile_patch_allowed === "boolean") {
    let patchAllowed = profile.profile_patch_allowed;
    const appStatus = profile.application_status?.trim() || profile.status?.trim() || "";
    let slotState = resolveIdentitySlotStateFromProfile(profile, patchAllowed);
    // Reconcile API drift: application_status/slot_state active but bool false.
    if (!patchAllowed && identitySlotStatusImpliesPatchAllowed(appStatus)) {
      patchAllowed = true;
      if (slotState === "inactive") slotState = "active";
    } else if (!patchAllowed && slotState.toLowerCase() === "active") {
      patchAllowed = true;
    }
    return { slotState, patchAllowed };
  }
  const appStatus = profile.application_status?.trim() || profile.status?.trim() || "";
  const slotFromApi =
    profile.slot_state?.trim() || profile.acquisition_slot_state?.trim() || "";
  const patchAllowed =
    identitySlotStatusImpliesPatchAllowed(appStatus) || slotFromApi.toLowerCase() === "active";
  const slotState = slotFromApi || (patchAllowed ? "active" : "inactive");
  return { slotState, patchAllowed };
}
