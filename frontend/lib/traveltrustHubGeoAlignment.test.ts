import { describe, expect, it } from "vitest";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { getTraveltrustHubGeo, TRAVELTRUST_HUB_GEO_BY_ID } from "@/lib/traveltrustHubGeo";
import {
  TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS,
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  resolveHeroP3HubLatLon,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { latLonToHeroP3ScreenPercent } from "@/lib/traveltrustHeroP3ScreenProjection";
import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";
import { TT_GLOBE_EARTH_SURFACE_RADIUS_MUL } from "@/lib/traveltrustGlobeEarthAsset";

const MAX_VIEWPORT_PCT_DELTA = 1.5;

function viewportPctDelta(
  a: { leftPct: number; topPct: number },
  b: { leftPct: number; topPct: number },
): { left: number; top: number } {
  return {
    left: Math.abs(a.leftPct - b.leftPct),
    top: Math.abs(a.topPct - b.topPct),
  };
}

describe("traveltrustHubGeo Pass B · P3 vs Phase1 alignment", () => {
  it("Phase1 region lat/lon mirrors hub geo SSOT", () => {
    for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
      const hub = getTraveltrustHubGeo(region.id as keyof typeof TRAVELTRUST_HUB_GEO_BY_ID);
      expect(region.lat).toBe(hub.lat);
      expect(region.lon).toBe(hub.lon);
    }
  });

  it("resolveTraveltrustHubLatLon returns WGS84 SSOT (lon sign applied in latLonToUnitVector)", () => {
    for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
      const pin = resolveTraveltrustHubLatLon(region);
      const ssot = getTraveltrustHubGeo(region.id as keyof typeof TRAVELTRUST_HUB_GEO_BY_ID);
      expect(pin).toEqual({ lat: ssot.lat, lon: ssot.lon });
    }
  });

  it("P3 nodes with phase1RegionId share hub coords with Phase1 pins", () => {
    for (const node of TRAVELTRUST_HERO_P3_DECOR_NODES) {
      if (!node.phase1RegionId) continue;
      const region = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === node.phase1RegionId);
      expect(region, `missing phase1 region ${node.phase1RegionId}`).toBeDefined();
      const pin = resolveTraveltrustHubLatLon(region!);
      const p3 = resolveHeroP3HubLatLon(node);
      expect(p3).toEqual(pin);
    }
  });

  it("core label nodes: P3 equirect projection within 1.5% viewport of Phase1 pin", () => {
    for (const nodeId of TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS) {
      const node = TRAVELTRUST_HERO_P3_DECOR_NODES.find((n) => n.id === nodeId)!;
      const region = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === node.phase1RegionId)!;
      const pin = resolveTraveltrustHubLatLon(region);
      const p3 = resolveHeroP3HubLatLon(node);
      const pinPct = latLonToHeroP3ScreenPercent(pin.lat, pin.lon);
      const p3Pct = latLonToHeroP3ScreenPercent(p3.lat, p3.lon);
      const d = viewportPctDelta(pinPct, p3Pct);
      expect(d.left, `${nodeId} leftPct`).toBeLessThanOrEqual(MAX_VIEWPORT_PCT_DELTA);
      expect(d.top, `${nodeId} topPct`).toBeLessThanOrEqual(MAX_VIEWPORT_PCT_DELTA);
    }
  });

  it("all linked P3 nodes: flat projection delta <= 1.5% viewport vs Phase1", () => {
    for (const node of TRAVELTRUST_HERO_P3_DECOR_NODES) {
      if (!node.phase1RegionId) continue;
      const region = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === node.phase1RegionId)!;
      const pinPct = latLonToHeroP3ScreenPercent(
        resolveTraveltrustHubLatLon(region).lat,
        resolveTraveltrustHubLatLon(region).lon,
      );
      const p3Hub = resolveHeroP3HubLatLon(node);
      const p3Pct = latLonToHeroP3ScreenPercent(p3Hub.lat, p3Hub.lon);
      const d = viewportPctDelta(pinPct, p3Pct);
      expect(d.left, node.id).toBeLessThanOrEqual(MAX_VIEWPORT_PCT_DELTA);
      expect(d.top, node.id).toBeLessThanOrEqual(MAX_VIEWPORT_PCT_DELTA);
    }
  });

  it("surface radius SSOT remains 0.998 for mesh/pin/projection chain", () => {
    expect(TT_GLOBE_EARTH_SURFACE_RADIUS_MUL).toBe(0.998);
  });
});
