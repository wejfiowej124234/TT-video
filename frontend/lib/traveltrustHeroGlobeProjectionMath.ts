/**
 * P3 · lat/lon → Hero 左栏 viewport（地球绑定投影 · ①）
 */
import type { Camera } from "three";
import * as THREE from "three";
import { latLonToUnitVector } from "@/lib/traveltrustPhase1GlobeRegions";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import type { HeroGlobeBoundScreenPoint } from "@/lib/traveltrustHeroGlobeProjectionStore";

const _world = new THREE.Vector3();
const _ndc = new THREE.Vector3();
const _hubDir = new THREE.Vector3();
const _camDir = new THREE.Vector3();

export type HeroGlobeProjectionRects = {
  canvas: DOMRectReadOnly;
  viewport: DOMRectReadOnly;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function resolveHeroGlobeFacingMinDot(tier: "S" | "A" | "B"): number {
  return tier === "B"
    ? TT_CINEMATIC_GLOBE_VISUAL.phase1PinFacingMinDotTierB
    : TT_CINEMATIC_GLOBE_VISUAL.phase1PinFacingMinDot;
}

/** 与 `TravelTrustPhase1GlobeHighlights` 针脚落点一致 */
export function latLonToGlobeSurfaceWorld(
  lat: number,
  lon: number,
  surfaceRadius: number,
  globeSurfaceMatrixWorld: THREE.Matrix4,
  out = _world,
): THREE.Vector3 {
  const [x, y, z] = latLonToUnitVector(lat, lon);
  return out.set(x, y, z).multiplyScalar(surfaceRadius).applyMatrix4(globeSurfaceMatrixWorld);
}

export function projectGlobeSurfaceToHeroViewport(
  lat: number,
  lon: number,
  surfaceRadius: number,
  globeSurfaceMatrixWorld: THREE.Matrix4,
  camera: Camera,
  rects: HeroGlobeProjectionRects,
  facingMinDot: number,
): HeroGlobeBoundScreenPoint {
  latLonToGlobeSurfaceWorld(lat, lon, surfaceRadius, globeSurfaceMatrixWorld, _world);
  _hubDir.copy(_world).normalize();
  _camDir.copy(camera.position).normalize();
  const facingDot = _hubDir.dot(_camDir);

  _ndc.copy(_world).project(camera);
  const canvasX = (_ndc.x * 0.5 + 0.5) * rects.canvas.width + rects.canvas.left;
  const canvasY = (-_ndc.y * 0.5 + 0.5) * rects.canvas.height + rects.canvas.top;

  const leftPct = clamp(
    ((canvasX - rects.viewport.left) / rects.viewport.width) * 100,
    -8,
    108,
  );
  const topPct = clamp(
    ((canvasY - rects.viewport.top) / rects.viewport.height) * 100,
    -8,
    108,
  );

  const inViewport =
    leftPct >= -2 &&
    leftPct <= 102 &&
    topPct >= -2 &&
    topPct <= 102 &&
    _ndc.z >= -1 &&
    _ndc.z <= 1;

  const limbFade = smoothstep(facingMinDot, facingMinDot + 0.22, facingDot);
  const edgeFadeX = 1 - smoothstep(0.62, 0.96, Math.abs(_ndc.x));
  const edgeFadeY = 1 - smoothstep(0.55, 0.92, Math.abs(_ndc.y));
  const edgeFade = clamp(limbFade * edgeFadeX * edgeFadeY, 0, 1);

  const visible = inViewport && facingDot >= facingMinDot && edgeFade > 0.04;

  return {
    leftPct,
    topPct,
    facingDot,
    visible,
    edgeFade,
  };
}
