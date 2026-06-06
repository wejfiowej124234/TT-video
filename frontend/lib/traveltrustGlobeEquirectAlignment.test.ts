import { describe, expect, it } from "vitest";
import { TRAVELTRUST_HUB_GEO_BY_ID } from "@/lib/traveltrustHubGeo";
import { latLonToUnitVector, TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";

/** Three.js SphereGeometry vertex at equirect UV (standard). */
function sphereUnitFromEquirectUv(u: number, v: number): [number, number, number] {
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;
  const sinPhi = Math.sin(phi);
  return [-sinPhi * Math.cos(theta), Math.cos(phi), sinPhi * Math.sin(theta)];
}

function uvFromWgs84(latDeg: number, lonDeg: number): { u: number; v: number } {
  return { u: (lonDeg + 180) / 360, v: (90 - latDeg) / 180 };
}

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

describe("traveltrustGlobeEquirectAlignment · WGS84 vs Three.js mesh (①)", () => {
  it("latLonToUnitVector aligns all Phase1 WGS84 hubs with equirect UV", () => {
    for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
      const wgs = TRAVELTRUST_HUB_GEO_BY_ID[region.id as keyof typeof TRAVELTRUST_HUB_GEO_BY_ID];
      const { u, v } = uvFromWgs84(wgs.lat, wgs.lon);
      const tex = sphereUnitFromEquirectUv(u, v);
      const vec = latLonToUnitVector(wgs.lat, wgs.lon);
      expect(dot3(vec, tex), region.id).toBeGreaterThan(0.99);
    }
  });

  it("legacy sin/cos without lon sign is wrong for cn/us (regression)", () => {
    for (const id of ["cn", "us"] as const) {
      const wgs = TRAVELTRUST_HUB_GEO_BY_ID[id];
      const { u, v } = uvFromWgs84(wgs.lat, wgs.lon);
      const tex = sphereUnitFromEquirectUv(u, v);
      const lat = (wgs.lat * Math.PI) / 180;
      const lon = (wgs.lon * Math.PI) / 180;
      const cosLat = Math.cos(lat);
      const legacy: [number, number, number] = [cosLat * Math.cos(lon), Math.sin(lat), cosLat * Math.sin(lon)];
      expect(dot3(legacy, tex), id).toBeLessThan(0.2);
    }
  });
});
