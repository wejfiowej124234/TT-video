import { describe, expect, it } from "vitest";
import { getTraveltrustHubGeo } from "@/lib/traveltrustHubGeo";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";

describe("traveltrustGlobePinDisplay", () => {
  it("uses city-level hub geo for fr/es (no pinLat/pinLon offset)", () => {
    const fr = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "fr")!;
    const es = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "es")!;
    const frPin = resolveTraveltrustHubLatLon(fr);
    const esPin = resolveTraveltrustHubLatLon(es);
    expect(frPin).toEqual({
      lat: getTraveltrustHubGeo("fr").lat,
      lon: getTraveltrustHubGeo("fr").lon,
    });
    expect(esPin).toEqual({
      lat: getTraveltrustHubGeo("es").lat,
      lon: getTraveltrustHubGeo("es").lon,
    });
    expect(Math.abs(frPin.lon - esPin.lon)).toBeGreaterThan(3);
  });

  it("keeps sg hub on land (no ocean pin)", () => {
    const sg = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "sg")!;
    const hub = resolveTraveltrustHubLatLon(sg);
    expect(hub.lat).toBeGreaterThan(0);
    expect(hub.lon).toBeGreaterThan(100);
  });
});
