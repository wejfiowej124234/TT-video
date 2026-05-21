/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import * as THREE from "three";
import { latLonToUnitVector } from "@/lib/traveltrustPhase1GlobeRegions";

/** Unit sphere position from Phase1 lat/lon (Y-up). */
export function latLonToGlobeVector(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const [x, y, z] = latLonToUnitVector(latDeg, lonDeg);
  return new THREE.Vector3(x, y, z).multiplyScalar(radius);
}

/** Great-circle arc samples between two surface points (illustrative routing · ①). */
export function greatCircleArcPoints(
  radius: number,
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  segments = 48,
  altitude = 1.014,
): THREE.Vector3[] {
  const v0 = latLonToGlobeVector(fromLat, fromLon, 1);
  const v1 = latLonToGlobeVector(toLat, toLon, 1);
  const angle = v0.angleTo(v1);
  const r = radius * altitude;
  const pts: THREE.Vector3[] = [];

  if (angle < 1e-5) {
    pts.push(v0.clone().multiplyScalar(r));
    return pts;
  }

  const sinA = Math.sin(angle);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = Math.sin((1 - t) * angle) / sinA;
    const b = Math.sin(t * angle) / sinA;
    pts.push(
      new THREE.Vector3()
        .copy(v0)
        .multiplyScalar(a)
        .add(v1.clone().multiplyScalar(b))
        .normalize()
        .multiplyScalar(r),
    );
  }
  return pts;
}
