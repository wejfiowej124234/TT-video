import { describe, expect, it } from "vitest";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";

describe("traveltrustGlobePinDisplay", () => {
  it("spreads EU pins away from route centroids", () => {
    const fr = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "fr")!;
    const es = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "es")!;
    const frPin = resolveTraveltrustHubLatLon(fr);
    const esPin = resolveTraveltrustHubLatLon(es);
    expect(frPin.lat).not.toBe(fr.lat);
    expect(esPin.lon).toBeLessThan(es.lon);
    expect(Math.abs(frPin.lon - esPin.lon)).toBeGreaterThan(8);
  });

  it("keeps sg hub on land (no ocean pin)", () => {
    const sg = TRAVELTRUST_PHASE1_GLOBE_REGIONS.find((r) => r.id === "sg")!;
    const hub = resolveTraveltrustHubLatLon(sg);
    expect(hub.lat).toBeGreaterThan(0);
    expect(hub.lon).toBeGreaterThan(100);
  });
});
