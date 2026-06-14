import { describe, expect, it } from "vitest";
import {
  publishHubDefaultFilterFromUnlockedSlots,
  publishHubFilterFromIdentityParam,
} from "@/lib/me/publishHubIdentityDefaultFilter";

describe("publishHubIdentityDefaultFilter", () => {
  it("maps identity query to rail filter", () => {
    expect(publishHubFilterFromIdentityParam("merchant")).toBe("merchant");
    expect(publishHubFilterFromIdentityParam("region_steward")).toBe("governance");
    expect(publishHubFilterFromIdentityParam("traveler")).toBe("trip");
  });

  it("returns null for unknown identity", () => {
    expect(publishHubFilterFromIdentityParam("unknown")).toBeNull();
  });

  it("defaults to sole unlocked operator slot", () => {
    expect(
      publishHubDefaultFilterFromUnlockedSlots({
        guideUnlocked: false,
        merchantUnlocked: true,
        acquisitionUnlocked: false,
        stewardUnlocked: false,
      }),
    ).toBe("merchant");
    expect(
      publishHubDefaultFilterFromUnlockedSlots({
        guideUnlocked: true,
        merchantUnlocked: true,
        acquisitionUnlocked: false,
        stewardUnlocked: false,
      }),
    ).toBeNull();
  });
});
