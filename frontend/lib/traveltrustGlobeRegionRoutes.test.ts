import { describe, expect, it } from "vitest";
import {
  listTraveltrustRoutesForRegion,
  traveltrustRouteTouchesRegion,
} from "@/lib/traveltrustGlobeRegionRoutes";

describe("traveltrustGlobeRegionRoutes", () => {
  it("lists corridors for cn hub", () => {
    const routes = listTraveltrustRoutesForRegion("cn");
    expect(routes.length).toBeGreaterThanOrEqual(2);
    expect(routes.some((r) => r.includes("法国") || r.includes("France"))).toBe(true);
  });

  it("detects route touch for arc hover", () => {
    expect(traveltrustRouteTouchesRegion("cn-fr", "cn")).toBe(true);
    expect(traveltrustRouteTouchesRegion("cn-fr", "jp")).toBe(false);
  });
});
