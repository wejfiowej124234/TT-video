import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HERO_P3_DECOR_NODES } from "./traveltrustHeroP3DecorNodes";
import { latLonToHeroP3ScreenPercent, projectHeroP3DecorNodes } from "./traveltrustHeroP3ScreenProjection";

describe("traveltrustHeroP3ScreenProjection", () => {
  it("projects 24 decor nodes", () => {
    expect(projectHeroP3DecorNodes(TRAVELTRUST_HERO_P3_DECOR_NODES)).toHaveLength(24);
  });

  it("latLonToHeroP3ScreenPercent clamps within viewport", () => {
    const cn = latLonToHeroP3ScreenPercent(31.2, 121.5);
    expect(cn.leftPct).toBeGreaterThan(50);
    expect(cn.topPct).toBeGreaterThan(20);
    expect(cn.topPct).toBeLessThan(80);
  });

  it("extreme lat/lon stay in bounds", () => {
    const north = latLonToHeroP3ScreenPercent(89, 0);
    const south = latLonToHeroP3ScreenPercent(-89, 0);
    expect(north.topPct).toBeLessThanOrEqual(94);
    expect(south.topPct).toBeGreaterThanOrEqual(6);
  });
});
