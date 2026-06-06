import { describe, expect, it } from "vitest";
import { meIdentitiesCoreIdentityHref, meIdentitiesHubSlotState } from "./meIdentitiesHubSlots";
import type { MeIdentitySlotId } from "@/lib/meIdentitySlots";

describe("meIdentitiesHubSlots", () => {
  const slotById = (id: MeIdentitySlotId) => {
    const map: Partial<Record<MeIdentitySlotId, { state: "active" | "pending" }>> = {
      guide: { state: "pending" },
      merchant: { state: "active" },
    };
    return map[id] ?? null;
  };

  it("maps surface ids to slot states", () => {
    expect(meIdentitiesHubSlotState("guide", slotById)).toBe("pending");
    expect(meIdentitiesHubSlotState("provider", slotById)).toBe("active");
    expect(meIdentitiesHubSlotState("acquisition", slotById)).toBeNull();
  });

  it("routes core identity cards to onboarding when slot is in progress", () => {
    expect(
      meIdentitiesCoreIdentityHref("provider", "pending", "/provider/register", "/me/onboarding?role=provider"),
    ).toBe("/me/onboarding?role=provider");
    expect(
      meIdentitiesCoreIdentityHref("provider", null, "/provider/register", "/me/onboarding?role=provider"),
    ).toBe("/provider/register");
  });
});
