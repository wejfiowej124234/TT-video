/**
 * 真实世界一致性 · 机读基线（①）
 * - D1：hub 坐标为已知城市 WGS84
 * - D3：单位球方向与 equirect UV (lon+180)/360 在 Three.js 惯例下一致
 * - D6：平面 Hero % 与 yaw=0 球面投影在 heroYawOffset 下会显著分离（说明不能用平面 % 当标签）
 */
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { getTraveltrustHubGeo } from "@/lib/traveltrustHubGeo";
import { latLonToUnitVector } from "@/lib/traveltrustPhase1GlobeRegions";
import { latLonToHeroP3ScreenPercent } from "@/lib/traveltrustHeroP3ScreenProjection";
import {
  latLonToGlobeSurfaceWorld,
  projectGlobeSurfaceToHeroViewport,
} from "@/lib/traveltrustHeroGlobeProjectionMath";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";

function equirectUvFromLatLon(latDeg: number, lonDeg: number) {
  return {
    u: (lonDeg + 180) / 360,
    v: (90 - latDeg) / 180,
  };
}

function sphereUnitFromEquirectUv(u: number, v: number): [number, number, number] {
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;
  const sinPhi = Math.sin(phi);
  return [-sinPhi * Math.cos(theta), Math.cos(phi), sinPhi * Math.sin(theta)];
}

function dot3(a: [number, number, number], b: [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

describe("traveltrustGlobeGeoRealWorldStandard", () => {
  it("D1: hub geo matches known city WGS84 (sample)", () => {
    expect(getTraveltrustHubGeo("cn")).toMatchObject({ cityEn: "Beijing", lat: 39.9042, lon: 116.4074 });
    expect(getTraveltrustHubGeo("jp")).toMatchObject({ cityEn: "Tokyo", lat: 35.6762, lon: 139.6503 });
    expect(getTraveltrustHubGeo("us")).toMatchObject({ cityEn: "New York", lat: 40.7128, lon: -74.006 });
  });

  it("D3: latLonToUnitVector matches Three.js SphereGeometry + equirect UV for hubs", () => {
    for (const id of ["cn", "jp", "us", "fr", "sg"] as const) {
      const { lat, lon } = getTraveltrustHubGeo(id);
      const { u, v } = equirectUvFromLatLon(lat, lon);
      const tex = sphereUnitFromEquirectUv(u, v);
      const vec = latLonToUnitVector(lat, lon);
      expect(dot3(vec, tex), id).toBeGreaterThan(0.99);
    }
  });

  it("D1b: hubs sit in northern/mid latitudes on unit sphere (not poles)", () => {
    for (const id of ["fr", "us", "cn", "jp"] as const) {
      const { lat, lon } = getTraveltrustHubGeo(id);
      const [, y] = latLonToUnitVector(lat, lon);
      expect(Math.abs(lat)).toBeLessThan(55);
      expect(y).toBeGreaterThan(0.15);
      expect(y).toBeLessThan(0.92);
      expect(lon).toBeGreaterThan(-180);
      expect(lon).toBeLessThan(180);
    }
  });

  it("D6: flat Hero % diverges from globe-bound % when heroYawOffset applied (labels must not use flat only)", () => {
    const { lat, lon } = getTraveltrustHubGeo("cn");
    const flat = latLonToHeroP3ScreenPercent(lat, lon);

    const surfaceR = 1.85 * 0.998;
    const spin = new THREE.Group();
    spin.rotation.y = TT_CINEMATIC_GLOBE_VISUAL.heroYawOffset;
    spin.updateMatrixWorld(true, false);
    const matrix = spin.matrixWorld.clone();

    const camera = new THREE.PerspectiveCamera(45, 1.2, 0.1, 100);
    camera.position.set(0.02, 0.1, 4.2);
    camera.lookAt(0, -0.28, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true, false);

    latLonToGlobeSurfaceWorld(lat, lon, surfaceR, matrix);
    const bound = projectGlobeSurfaceToHeroViewport(
      lat,
      lon,
      surfaceR,
      matrix,
      camera,
      {
        canvas: { left: 0, top: 0, width: 1200, height: 800 } as DOMRectReadOnly,
        viewport: { left: 0, top: 120, width: 520, height: 520 } as DOMRectReadOnly,
      },
      0.08,
    );

    const deltaLeft = Math.abs(flat.leftPct - bound.leftPct);
    const deltaTop = Math.abs(flat.topPct - bound.topPct);
    expect(deltaLeft).toBeGreaterThan(5);
    expect(deltaTop).toBeGreaterThan(3);
  });
});
