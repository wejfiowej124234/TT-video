/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import * as THREE from "three";
import { wgs84LonToGlobeSurfaceLonDeg } from "@/lib/traveltrustHubGeo";

/** 装饰地球主光源方向（与夜灯 shader · FillLight 同向 · ①） */
export const TRAVELTRUST_GLOBE_SUN_DIR = new THREE.Vector3(0.12, 0.28, 1).normalize();

export function traveltrustGlobeSunLightPosition(radius: number, distanceMul = 8): THREE.Vector3 {
  return TRAVELTRUST_GLOBE_SUN_DIR.clone().multiplyScalar(radius * distanceMul);
}

/** 太阳直射点 · equirect UV（0–1）· 与 `latLonToUnitVector` 同系 */
export function resolveGlobeSunEquirectCentroid(): { u: number; v: number } {
  const y = THREE.MathUtils.clamp(TRAVELTRUST_GLOBE_SUN_DIR.y, -1, 1);
  const latDeg = (Math.asin(y) * 180) / Math.PI;
  const lonDeg = (Math.atan2(TRAVELTRUST_GLOBE_SUN_DIR.z, TRAVELTRUST_GLOBE_SUN_DIR.x) * 180) / Math.PI;
  const lonGlobe = wgs84LonToGlobeSurfaceLonDeg(lonDeg);
  const u = (((lonGlobe % 360) + 360) % 360) / 360;
  const v = (90 - latDeg) / 180;
  return { u, v: Math.max(0.04, Math.min(0.96, v)) };
}
