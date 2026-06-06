import { describe, expect, it } from "vitest";
import { buildLandingToMarketHref, snapLandingDaysToMarketPreset } from "./landingMarketDeepLink";

describe("landingMarketDeepLink", () => {
  it("snaps trip days to nearest market hero preset", () => {
    expect(snapLandingDaysToMarketPreset(4)).toBe(3);
    expect(snapLandingDaysToMarketPreset(6)).toBe(5);
    expect(snapLandingDaysToMarketPreset(7)).toBe(7);
  });

  it("builds market href with exact trip days", () => {
    expect(
      buildLandingToMarketHref({ country: "中国", city: "北京", days: 5 }),
    ).toBe("/market?country=%E4%B8%AD%E5%9B%BD&city=%E5%8C%97%E4%BA%AC&days=5");
    expect(buildLandingToMarketHref({ country: "中国", city: "北京", days: 4 })).toContain("days=4");
  });

  it("omits query when form is empty", () => {
    expect(buildLandingToMarketHref({ country: "", days: 0 })).toBe("/market");
  });
});
