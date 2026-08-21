import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HERO_P3_DECOR_NODES, resolveHeroP3HubLatLon } from "./traveltrustHeroP3DecorNodes";
import { getTraveltrustHubGeo } from "./traveltrustHubGeo";
import { latLonToHeroP3ScreenPercent, projectHeroP3DecorNodes } from "./traveltrustHeroP3ScreenProjection";

describe("traveltrustHeroP3ScreenProjection", () => {
  it("projects 24 decor nodes", () => {
    expect(projectHeroP3DecorNodes(TRAVELTRUST_HERO_P3_DECOR_NODES)).toHaveLength(24);
  });

  it("latLonToHeroP3ScreenPercent clamps within viewport", () => {
    const sh = getTraveltrustHubGeo("cn");
    const cn = latLonToHeroP3ScreenPercent(sh.lat, sh.lon);
    expect(cn.leftPct).toBeGreaterThan(50);
    expect(cn.topPct).toBeGreaterThan(20);
    expect(cn.topPct).toBeLessThan(80);
  });

  it("projectHeroP3DecorNodes uses hub geo resolver", () => {
    const first = TRAVELTRUST_HERO_P3_DECOR_NODES[0]!;
    const hub = resolveHeroP3HubLatLon(first);
    const projected = projectHeroP3DecorNodes([first])[0]!;
    const flat = latLonToHeroP3ScreenPercent(hub.lat, hub.lon);
    expect(projected.leftPct).toBe(flat.leftPct);
    expect(projected.topPct).toBe(flat.topPct);
  });

  it("extreme lat/lon stay in bounds", () => {
    const north = latLonToHeroP3ScreenPercent(89, 0);
    const south = latLonToHeroP3ScreenPercent(-89, 0);
    expect(north.topPct).toBeLessThanOrEqual(94);
    expect(south.topPct).toBeGreaterThanOrEqual(6);
  });
});
