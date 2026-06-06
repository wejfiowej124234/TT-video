import { describe, expect, it } from "vitest";
import {
  listTraveltrustRoutesForRegion,
  traveltrustRouteTouchesRegion,
} from "@/lib/traveltrustGlobeRegionRoutes";

describe("traveltrustGlobeRegionRoutes", () => {
  it("lists corridors for cn hub", () => {
    const routes = listTraveltrustRoutesForRegion("cn");
    expect(routes.length).toBeGreaterThanOrEqual(2);
    expect(routes.some((r) => r.label.includes("法国") || r.label.includes("France"))).toBe(true);
    expect(new Set(routes.map((r) => r.id)).size).toBe(routes.length);
  });

  it("uses unique route ids for es hub (us-es and es-us share label direction from hub)", () => {
    const routes = listTraveltrustRoutesForRegion("es");
    const labels = routes.map((r) => r.label);
    const ids = routes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    if (labels.filter((l) => l === "西班牙 → 美国").length > 1) {
      expect(ids).toContain("us-es");
      expect(ids).toContain("es-us");
    }
  });

  it("detects route touch for arc hover", () => {
    expect(traveltrustRouteTouchesRegion("cn-fr", "cn")).toBe(true);
    expect(traveltrustRouteTouchesRegion("cn-fr", "jp")).toBe(false);
  });
});
