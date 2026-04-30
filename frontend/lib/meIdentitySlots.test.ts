import { describe, expect, it } from "vitest";
import {
  ME_IDENTITY_SPINE_SLOT_IDS,
  meIdentitySpineActiveCount,
  meIdentitySpineActiveCountFromMePayload,
  parseIdentitySlotsFromMe,
} from "./meIdentitySlots";

describe("meIdentitySlots (96-17 traveler/guide spine)", () => {
  it("exports four spine ids without region_steward", () => {
    expect(ME_IDENTITY_SPINE_SLOT_IDS).toEqual(["traveler", "guide", "merchant", "acquisition"]);
    expect(ME_IDENTITY_SPINE_SLOT_IDS).not.toContain("region_steward");
  });

  it("meIdentitySpineActiveCount ignores region_steward even when active", () => {
    const slots = parseIdentitySlotsFromMe({
      user: { id: "u1", role: "tourist" },
      identity_slots: [
        { id: "traveler", state: "active", stake_display: null },
        { id: "guide", state: "pending", stake_display: null },
        { id: "acquisition", state: "inactive", stake_display: null },
        { id: "merchant", state: "inactive", stake_display: null },
        { id: "region_steward", state: "active", stake_display: null },
      ],
    });
    expect(meIdentitySpineActiveCount(slots)).toBe(1);
  });

  it("traveler + guide active yields spine count 2", () => {
    const slots = parseIdentitySlotsFromMe({
      user: { id: "u1", role: "tourist" },
      identity_slots: [
        { id: "traveler", state: "active", stake_display: null },
        { id: "guide", state: "active", stake_display: "1 USDT" },
        { id: "acquisition", state: "inactive", stake_display: null },
        { id: "merchant", state: "inactive", stake_display: null },
        { id: "region_steward", state: "inactive", stake_display: null },
      ],
    });
    expect(meIdentitySpineActiveCount(slots)).toBe(2);
  });

  it("partial identity_slots merges missing slots from user+guide projection", () => {
    const slots = parseIdentitySlotsFromMe({
      user: { id: "u1", role: "tourist" },
      guide: { status: "pending", stake_amount: "0" },
      identity_slots: [{ id: "traveler", state: "active", stake_display: "bad" }],
    });
    expect(slots.map((s) => s.id)).toEqual([
      "traveler",
      "guide",
      "acquisition",
      "merchant",
      "region_steward",
    ]);
    expect(slots.find((s) => s.id === "traveler")?.stake_display).toBeNull();
    expect(slots.find((s) => s.id === "guide")?.state).toBe("pending");
    expect(meIdentitySpineActiveCount(slots)).toBe(1);
  });

  it("meIdentitySpineActiveCountFromMePayload uses backend count when integer in 0..4", () => {
    const data = {
      user: { id: "u1", role: "tourist" },
      identity_slots_spine_active_count: 2,
      identity_slots: [
        { id: "traveler", state: "inactive", stake_display: null },
        { id: "guide", state: "inactive", stake_display: null },
        { id: "acquisition", state: "inactive", stake_display: null },
        { id: "merchant", state: "inactive", stake_display: null },
        { id: "region_steward", state: "inactive", stake_display: null },
      ],
    };
    expect(meIdentitySpineActiveCountFromMePayload(data)).toBe(2);
    expect(meIdentitySpineActiveCount(parseIdentitySlotsFromMe(data))).toBe(0);
  });

  it("meIdentitySpineActiveCountFromMePayload falls back when count out of range or non-integer", () => {
    const base = {
      user: { id: "u1", role: "tourist" },
      identity_slots: [
        { id: "traveler", state: "active", stake_display: null },
        { id: "guide", state: "active", stake_display: null },
        { id: "acquisition", state: "inactive", stake_display: null },
        { id: "merchant", state: "inactive", stake_display: null },
        { id: "region_steward", state: "inactive", stake_display: null },
      ],
    };
    expect(meIdentitySpineActiveCountFromMePayload({ ...base, identity_slots_spine_active_count: 5 })).toBe(2);
    expect(meIdentitySpineActiveCountFromMePayload({ ...base, identity_slots_spine_active_count: -1 })).toBe(2);
    expect(meIdentitySpineActiveCountFromMePayload({ ...base, identity_slots_spine_active_count: 1.5 })).toBe(2);
    expect(meIdentitySpineActiveCountFromMePayload({ ...base, identity_slots_spine_active_count: "2" })).toBe(2);
  });

  it("meIdentitySpineActiveCountFromMePayload falls back when field absent", () => {
    expect(
      meIdentitySpineActiveCountFromMePayload({
        user: { id: "u1", role: "tourist" },
        identity_slots: [
          { id: "traveler", state: "active", stake_display: null },
          { id: "guide", state: "inactive", stake_display: null },
          { id: "acquisition", state: "inactive", stake_display: null },
          { id: "merchant", state: "inactive", stake_display: null },
          { id: "region_steward", state: "inactive", stake_display: null },
        ],
      }),
    ).toBe(1);
  });
});
