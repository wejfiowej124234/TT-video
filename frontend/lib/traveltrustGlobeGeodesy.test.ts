import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { greatCircleArcPoints, latLonToGlobeVector } from "@/lib/traveltrustGlobeGeodesy";

describe("traveltrustGlobeGeodesy", () => {
  it("places Shanghai hub near expected unit vector", () => {
    const p = latLonToGlobeVector(31.2, 121.5, 1);
    expect(p.length()).toBeCloseTo(1, 5);
    expect(p.y).toBeGreaterThan(0);
  });

  it("great-circle arc stays near sphere radius", () => {
    const r = 1.78;
    const pts = greatCircleArcPoints(r, 31.2, 121.5, 48.86, 2.35, 32);
    for (const p of pts) {
      expect(p.length()).toBeCloseTo(r * 1.014, 2);
    }
    expect(pts.length).toBe(33);
    const mid = pts[Math.floor(pts.length / 2)];
    expect(mid.length()).toBeGreaterThan(r);
  });
});
