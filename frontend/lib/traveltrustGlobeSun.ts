/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import * as THREE from "three";

/** 装饰地球主光源方向（与夜灯 shader · FillLight 同向 · ①） */
export const TRAVELTRUST_GLOBE_SUN_DIR = new THREE.Vector3(0.12, 0.28, 1).normalize();

export function traveltrustGlobeSunLightPosition(radius: number, distanceMul = 8): THREE.Vector3 {
  return TRAVELTRUST_GLOBE_SUN_DIR.clone().multiplyScalar(radius * distanceMul);
}
