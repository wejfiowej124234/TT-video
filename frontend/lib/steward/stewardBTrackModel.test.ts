import { describe, expect, it } from "vitest";
import { isStewardBTrackComplete, isStewardBTrackPaid } from "./stewardBTrackModel";

describe("stewardBTrackModel", () => {
  const paidEntitlements = {
    items: [{ id: "e1", roleTarget: "region_steward", sku: "x", status: "paid", paidAt: null, expiresAt: null }],
    implementationStatus: null,
    hasActivePaid: true,
  };

  it("isStewardBTrackPaid checks region_steward entitlement only", () => {
    expect(isStewardBTrackPaid(paidEntitlements)).toBe(true);
    expect(
      isStewardBTrackPaid({
        items: [{ id: "e1", roleTarget: "provider", sku: "x", status: "paid", paidAt: null, expiresAt: null }],
        implementationStatus: null,
        hasActivePaid: true,
      }),
    ).toBe(false);
  });

  it("isStewardBTrackComplete is role-confirm only (fee REMOVE · G088)", () => {
    expect(
      isStewardBTrackComplete({
        entitlements: paidEntitlements,
        mePayload: { user: { id: "u1", role: "region_steward" } },
      }),
    ).toBe(true);
    expect(
      isStewardBTrackComplete({
        entitlements: {
          items: [],
          implementationStatus: null,
          hasActivePaid: false,
        },
        mePayload: { user: { id: "u1", role: "region_steward" } },
      }),
    ).toBe(true);
    expect(
      isStewardBTrackComplete({
        entitlements: paidEntitlements,
        mePayload: { user: { id: "u1", role: "tourist" } },
      }),
    ).toBe(false);
  });
});
