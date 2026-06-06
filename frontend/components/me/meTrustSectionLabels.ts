import type { MeIdentitySlot, MeIdentitySlotState } from "@/lib/meIdentitySlots";

export function meTrustSlotLabelKey(id: MeIdentitySlot["id"]): string {
  switch (id) {
    case "traveler":
      return "me_identity_slot_traveler";
    case "guide":
      return "me_identity_slot_guide";
    case "acquisition":
      return "me_identity_slot_acquisition";
    case "merchant":
      return "me_identity_slot_merchant";
    case "region_steward":
      return "me_identity_slot_region_steward";
    default:
      return "me_identity_slot_traveler";
  }
}

export function meTrustStateLabelKey(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return "me_identity_state_active";
    case "pending":
      return "me_identity_state_pending";
    case "restricted":
      return "me_identity_state_restricted";
    default:
      return "me_identity_state_inactive";
  }
}

export function meTrustStatePillClass(state: MeIdentitySlotState): string {
  switch (state) {
    case "active":
      return "bg-success/20 text-success border border-success/45";
    case "pending":
      return "bg-warning/15 text-warning/95 border border-warning/40";
    case "restricted":
      return "bg-danger/15 text-danger/90 border border-danger/40";
    default:
      return "bg-ink-700/70 text-slate-300 border border-slate-600/60";
  }
}
