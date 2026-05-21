/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import { TT_HERO_GLOBE_L5_PALETTE } from "@/lib/traveltrustCinematicPageL5";

/** Phase 1 country anchors for globe highlights (84 / protocol-reference · mock ①). */
export type TravelTrustPhase1GlobeRegion = {
  id: string;
  nameZh: string;
  tier: "S" | "A" | "B";
  lat: number;
  lon: number;
  /** Optional visual-only pin offset (great-circle arcs use `lat`/`lon`). */
  pinLat?: number;
  pinLon?: number;
};

/** Tourism hub coords on land (pins + arcs share `lat`/`lon` · illustrative). */
export const TRAVELTRUST_PHASE1_GLOBE_REGIONS: TravelTrustPhase1GlobeRegion[] = [
  { id: "cn", nameZh: "中国", tier: "S", lat: 31.2, lon: 121.5 },
  { id: "us", nameZh: "美国", tier: "S", lat: 40.7, lon: -74 },
  { id: "fr", nameZh: "法国", tier: "S", lat: 48.86, lon: 2.35, pinLat: 47.2, pinLon: 4.5 },
  { id: "es", nameZh: "西班牙", tier: "S", lat: 40.4, lon: -3.7, pinLat: 36.5, pinLon: -8.5 },
  { id: "jp", nameZh: "日本", tier: "A", lat: 35.68, lon: 139.69 },
  { id: "th", nameZh: "泰国", tier: "A", lat: 13.75, lon: 100.5 },
  { id: "sg", nameZh: "新加坡", tier: "A", lat: 1.29, lon: 103.85 },
  { id: "kr", nameZh: "韩国", tier: "A", lat: 37.57, lon: 126.98 },
  { id: "au", nameZh: "澳大利亚", tier: "B", lat: -33.87, lon: 151.21 },
  { id: "ae", nameZh: "阿联酋", tier: "B", lat: 25.2, lon: 55.27 },
];

export function latLonToUnitVector(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return [cosLat * Math.cos(lon), Math.sin(lat), cosLat * Math.sin(lon)];
}

export const PHASE1_TIER_GLOW: Record<TravelTrustPhase1GlobeRegion["tier"], string> = {
  S: TT_HERO_GLOBE_L5_PALETTE.tierGlow.S,
  A: TT_HERO_GLOBE_L5_PALETTE.tierGlow.A,
  B: TT_HERO_GLOBE_L5_PALETTE.tierGlow.B,
};
