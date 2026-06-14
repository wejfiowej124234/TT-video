import { describe, expect, it } from "vitest";
import { resolveIdentityProfilePatchGate } from "./identitySlotSettingsGate";

describe("identitySlotSettingsGate", () => {
  it("mirrors API profile_patch_allowed when present", () => {
    expect(resolveIdentityProfilePatchGate({ slot_state: "pending", profile_patch_allowed: false })).toEqual({
      slotState: "pending",
      patchAllowed: false,
    });
    expect(resolveIdentityProfilePatchGate({ slot_state: "active", profile_patch_allowed: true })).toEqual({
      slotState: "active",
      patchAllowed: true,
    });
  });

  it("falls back to acquisition_slot_state alias", () => {
    expect(
      resolveIdentityProfilePatchGate({
        acquisition_slot_state: "restricted",
        profile_patch_allowed: false,
      }),
    ).toEqual({ slotState: "restricted", patchAllowed: false });
  });

  it("defaults to read-only when gate fields missing", () => {
    expect(resolveIdentityProfilePatchGate(null)).toEqual({ slotState: "inactive", patchAllowed: false });
    expect(resolveIdentityProfilePatchGate({})).toEqual({ slotState: "inactive", patchAllowed: false });
  });

  it("derives patch allowed from application_status when bool omitted", () => {
    expect(
      resolveIdentityProfilePatchGate({
        application_status: "active",
        status: "active",
      }),
    ).toEqual({ slotState: "active", patchAllowed: true });
    expect(
      resolveIdentityProfilePatchGate({
        application_status: "pending",
        slot_state: "pending",
      }),
    ).toEqual({ slotState: "pending", patchAllowed: false });
  });

  it("reconciles active application_status when profile_patch_allowed is false", () => {
    expect(
      resolveIdentityProfilePatchGate({
        application_status: "active",
        profile_patch_allowed: false,
        slot_state: "inactive",
      }),
    ).toEqual({ slotState: "active", patchAllowed: true });
  });
});
