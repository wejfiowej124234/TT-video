/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import type { Camera } from "three";
import * as THREE from "three";
import { resolveTraveltrustHubLatLon } from "@/lib/traveltrustGlobePinDisplay";
import { latLonToUnitVector, TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";

/** Hero 面向美洲时优先大西洋走廊（避免北太平洋悬空弦） */
export const HERO_GLOBE_ROUTE_SET_ATLANTIC = new Set(["us-fr", "us-es", "fr-es", "es-us"]);

/** Hero 面向欧亚时优先亚太走廊（不含 cn-fr，避免欧陆光团） */
export const HERO_GLOBE_ROUTE_SET_ASIA = new Set(["cn-th", "cn-jp", "jp-sg"]);

/** 大西洋视角仅保留两条旗舰越洋线 */
export const HERO_GLOBE_ATLANTIC_ROUTE_IDS = ["us-fr", "us-es"] as const;

/** 中性视角下易形成北俄光团的走廊 */
export const HERO_GLOBE_ROUTE_EXCLUDE_ANY = new Set(["cn-fr", "fr-es", "fr-ae", "es-us"]);

/** 亚太视角优先走廊（≤3 条） */
export const HERO_GLOBE_ASIA_ROUTE_IDS = ["cn-th", "cn-jp", "jp-sg"] as const;

const REGION_BY_ID = Object.fromEntries(TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => [r.id, r])) as Record<
  string,
  (typeof TRAVELTRUST_PHASE1_GLOBE_REGIONS)[number]
>;

const _hub = new THREE.Vector3();
const _cam = new THREE.Vector3();

export type HeroGlobeRouteBias = "atlantic" | "asia" | "any";

export function hubWorldFacingDot(regionId: string, camera: Camera, matrixWorld: THREE.Matrix4): number {
  const region = REGION_BY_ID[regionId];
  if (!region) return -1;
  const hub = resolveTraveltrustHubLatLon(region);
  const [x, y, z] = latLonToUnitVector(hub.lat, hub.lon);
  _hub.set(x, y, z).applyMatrix4(matrixWorld).normalize();
  _cam.copy(camera.position).normalize();
  return _hub.dot(_cam);
}

export function resolveHeroGlobeRouteBias(camera: Camera, matrixWorld: THREE.Matrix4): HeroGlobeRouteBias {
  const us = hubWorldFacingDot("us", camera, matrixWorld);
  const cn = hubWorldFacingDot("cn", camera, matrixWorld);
  if (us > 0.12 && us >= cn) return "atlantic";
  if (cn > 0.12 && cn > us) return "asia";
  return "any";
}

export function filterHeroTravelRoutes<T extends { id: string }>(
  routes: readonly T[],
  bias: HeroGlobeRouteBias,
): T[] {
  if (bias === "atlantic") {
    const primary = HERO_GLOBE_ATLANTIC_ROUTE_IDS.map((id) => routes.find((r) => r.id === id)).filter(
      Boolean,
    ) as T[];
    if (primary.length > 0) return primary;
    const atlantic = routes.filter((r) => HERO_GLOBE_ROUTE_SET_ATLANTIC.has(r.id));
    return atlantic.slice(0, 2);
  }
  if (bias === "asia") {
    const primary = HERO_GLOBE_ASIA_ROUTE_IDS.map((id) => routes.find((r) => r.id === id)).filter(
      Boolean,
    ) as T[];
    if (primary.length > 0) return primary;
    const asia = routes.filter((r) => HERO_GLOBE_ROUTE_SET_ASIA.has(r.id));
    return asia.slice(0, 3);
  }
  return routes.filter((r) => !HERO_GLOBE_ROUTE_EXCLUDE_ANY.has(r.id));
}

export function arcWorldFacingDots(
  points: THREE.Vector3[],
  camera: Camera,
  matrixWorld: THREE.Matrix4,
): { mid: number; e0: number; e1: number } {
  _cam.copy(camera.position).normalize();
  const dotAt = (idx: number) => {
    _hub.copy(points[idx]).applyMatrix4(matrixWorld).normalize();
    return _hub.dot(_cam);
  };
  return {
    e0: dotAt(0),
    e1: dotAt(points.length - 1),
    mid: dotAt(Math.floor(points.length / 2)),
  };
}

export function arcFacesCameraWorld(
  points: THREE.Vector3[],
  camera: Camera,
  matrixWorld: THREE.Matrix4,
): boolean {
  const minMid = TT_CINEMATIC_GLOBE_VISUAL.travelArcFacingMinDot;
  const minEnd = TT_CINEMATIC_GLOBE_VISUAL.travelArcEndpointMinDot;
  const { mid, e0, e1 } = arcWorldFacingDots(points, camera, matrixWorld);
  if (mid < minMid) return false;
  if (TT_CINEMATIC_GLOBE_VISUAL.travelArcRequireBothEndpoints) {
    if (e0 < minEnd || e1 < minEnd) return false;
  } else if (Math.max(e0, e1) < minEnd) {
    return false;
  }
  return true;
}

export function arcBothEndpointsFaceCamera(
  points: THREE.Vector3[],
  camera: Camera,
  matrixWorld: THREE.Matrix4,
): boolean {
  const minEnd = TT_CINEMATIC_GLOBE_VISUAL.travelArcPulseEndpointMinDot;
  const { e0, e1 } = arcWorldFacingDots(points, camera, matrixWorld);
  return e0 >= minEnd && e1 >= minEnd;
}

/** Midpoint lat/lon from arc samples (unit sphere · Y-up). */
export function arcMidpointLatLon(points: THREE.Vector3[]): { lat: number; lon: number } {
  const mid = points[Math.floor(points.length / 2)] ?? points[0];
  const n = mid.clone().normalize();
  const lat = (Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) * 180) / Math.PI;
  const lon = (Math.atan2(n.z, n.x) * 180) / Math.PI;
  return { lat, lon };
}

function angularDistanceDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sqrt(
    Math.pow(Math.cos(φ2) * Math.sin(Δλ), 2) +
      Math.pow(Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ), 2),
  );
  const x = Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/** Decorative open-ocean band (North / mid Pacific · not flight data). */
export function isIllustrativeOpenOceanMidpoint(lat: number, lon: number): boolean {
  let l = lon;
  while (l > 180) l -= 360;
  while (l < -180) l += 360;
  if (lat < -12 || lat > 52) return false;
  if (l >= 138 && l <= 240) return true;
  if (l <= -118 && l >= -168) return true;
  return false;
}

/** Midpoint farther than this from every hub → treat as open-ocean decorative chord (①). */
export const TRAVEL_ARC_MIDPOINT_MIN_HUB_DISTANCE_DEG = 22;

/** Nearest angular distance (deg) from a surface point to any Phase1 land hub. */
export function nearestPhase1HubDistanceDeg(lat: number, lon: number): number {
  let nearest = Infinity;
  for (const region of TRAVELTRUST_PHASE1_GLOBE_REGIONS) {
    const hub = resolveTraveltrustHubLatLon(region);
    nearest = Math.min(nearest, angularDistanceDeg(lat, lon, hub.lat, hub.lon));
  }
  return nearest;
}

/** Midpoint far from every Phase1 land hub → chord reads as open-ocean (not a hub). */
export function arcMidpointFarFromPhase1Hubs(
  points: THREE.Vector3[],
  minHubDistanceDeg = TRAVEL_ARC_MIDPOINT_MIN_HUB_DISTANCE_DEG,
): boolean {
  const { lat, lon } = arcMidpointLatLon(points);
  return nearestPhase1HubDistanceDeg(lat, lon) > minHubDistanceDeg;
}

/** Flow pulse only when within this distance of a land hub (keeps dots off open ocean). */
export const TRAVEL_ARC_PULSE_MAX_HUB_DISTANCE_DEG = 11;

export function arcFlowPulseNearLandHub(lat: number, lon: number): boolean {
  return nearestPhase1HubDistanceDeg(lat, lon) <= TRAVEL_ARC_PULSE_MAX_HUB_DISTANCE_DEG;
}

/** Unit-sphere point (local or world — direction only) → lat/lon deg. */
export function globeVectorToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const n = v.clone().normalize();
  const lat = (Math.asin(THREE.MathUtils.clamp(n.y, -1, 1)) * 180) / Math.PI;
  const lon = (Math.atan2(n.z, n.x) * 180) / Math.PI;
  return { lat, lon };
}

/** @deprecated alias */
export const arcCrossesIllustrativeOpenOcean = arcMidpointFarFromPhase1Hubs;

/** Reject chords whose midpoint faces camera but neither hub does (orphan sea arc). */
export function arcIsOrphanSeaChord(
  points: THREE.Vector3[],
  camera: Camera,
  matrixWorld: THREE.Matrix4,
): boolean {
  const { mid, e0, e1 } = arcWorldFacingDots(points, camera, matrixWorld);
  const minMid = TT_CINEMATIC_GLOBE_VISUAL.travelArcFacingMinDot;
  const minEnd = TT_CINEMATIC_GLOBE_VISUAL.travelArcEndpointMinDot;
  if (mid < minMid) return false;
  return Math.max(e0, e1) < minEnd;
}

export function hubPinFacesCamera(
  regionId: string,
  camera: Camera,
  matrixWorld: THREE.Matrix4,
  tier: "S" | "A" | "B",
): boolean {
  const dot = hubWorldFacingDot(regionId, camera, matrixWorld);
  const min =
    tier === "B"
      ? TT_CINEMATIC_GLOBE_VISUAL.phase1PinFacingMinDotTierB
      : TT_CINEMATIC_GLOBE_VISUAL.phase1PinFacingMinDot;
  return dot >= min;
}

export type GlobeArcPick<T extends { id: string; points: THREE.Vector3[]; tier: "S" | "A" }> = T & {
  bothEndpointsVisible: boolean;
};

export function selectFacingArcsWorld<T extends { id: string; points: THREE.Vector3[]; tier: "S" | "A" }>(
  arcs: T[],
  maxCount: number,
  camera: Camera,
  matrixWorld: THREE.Matrix4,
): GlobeArcPick<T>[] {
  let facing = arcs
    .filter((a) => arcFacesCameraWorld(a.points, camera, matrixWorld))
    .filter((a) => !arcIsOrphanSeaChord(a.points, camera, matrixWorld))
    .map((a) => ({
      ...a,
      bothEndpointsVisible: arcBothEndpointsFaceCamera(a.points, camera, matrixWorld),
    }));

  const sTier = facing.filter((a) => a.tier === "S");
  const aTier = facing
    .filter((a) => a.tier === "A")
    .map((a) => {
      const { mid } = arcWorldFacingDots(a.points, camera, matrixWorld);
      return { arc: a, dot: mid };
    })
    .sort((x, y) => y.dot - x.dot);

  const picked: GlobeArcPick<T>[] = [...sTier];
  for (const { arc } of aTier) {
    if (picked.length >= maxCount) break;
    picked.push(arc);
  }
  if (picked.length < maxCount) {
    for (const arc of sTier) {
      if (picked.length >= maxCount) break;
      if (!picked.includes(arc)) picked.push(arc);
    }
  }
  if (picked.length === 0 && facing.length > 0) {
    facing = arcs
      .filter((a) => !arcIsOrphanSeaChord(a.points, camera, matrixWorld))
      .map((a) => ({
        ...a,
        bothEndpointsVisible: arcBothEndpointsFaceCamera(a.points, camera, matrixWorld),
      }));
    const relaxed = [...facing].sort((a, b) => {
      const da = arcWorldFacingDots(a.points, camera, matrixWorld);
      const db = arcWorldFacingDots(b.points, camera, matrixWorld);
      return Math.max(db.e0, db.e1, db.mid) - Math.max(da.e0, da.e1, da.mid);
    });
    return relaxed.slice(0, maxCount);
  }
  return picked.slice(0, maxCount);
}
