import { describe, expect, it } from "vitest";
import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";
import { TRAVELTRUST_PHASE1_TRAVEL_ROUTES } from "@/lib/traveltrustPhase1TravelRoutes";

describe("traveltrustPhase1TravelRoutes", () => {
  it("every Phase1 hub touches at least one illustrative corridor", () => {
    for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
      const touched = TRAVELTRUST_PHASE1_TRAVEL_ROUTES.some(
        (r) => r.fromId === region.id || r.toId === region.id,
      );
      expect(touched, `no route for ${region.id}`).toBe(true);
    }
  });

  it("includes Korea corridors", () => {
    const ids = TRAVELTRUST_PHASE1_TRAVEL_ROUTES.map((r) => r.id);
    expect(ids).toContain("kr-cn");
    expect(ids).toContain("kr-jp");
  });

  it("includes P0/P1 Asia–MENA and Thailand spokes", () => {
    const ids = TRAVELTRUST_PHASE1_TRAVEL_ROUTES.map((r) => r.id);
    expect(ids).toContain("sg-ae");
    expect(ids).toContain("sg-au");
    expect(ids).toContain("th-sg");
  });

  it("each Phase1 hub has at least two illustrative corridors (四通八达)", () => {
    const degree: Record<string, number> = {};
    for (const route of TRAVELTRUST_PHASE1_TRAVEL_ROUTES) {
      degree[route.fromId] = (degree[route.fromId] ?? 0) + 1;
      degree[route.toId] = (degree[route.toId] ?? 0) + 1;
    }
    for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
      expect(degree[region.id] ?? 0, region.id).toBeGreaterThanOrEqual(2);
    }
  });

});
