/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import { TT_HERO_GLOBE_L5_PALETTE } from "@/lib/traveltrustCinematicPageL5";
import {
  getTraveltrustHubGeo,
  wgs84LonToGlobeSurfaceLonDeg,
  type TraveltrustHubGeoId,
} from "@/lib/traveltrustHubGeo";

/** Phase 1 country anchors for globe highlights (84 / protocol-reference · mock ①). */
export type TravelTrustPhase1GlobeRegion = {
  id: string;
  nameZh: string;
  tier: "S" | "A" | "B";
  /** 与 `traveltrustHubGeo` 同步 · 仅供类型兼容；读取请用 `resolveTraveltrustHubLatLon` */
  lat: number;
  lon: number;
};

const PHASE1_REGION_META: { id: TraveltrustHubGeoId; nameZh: string; tier: TravelTrustPhase1GlobeRegion["tier"] }[] =
  [
    { id: "cn", nameZh: "中国", tier: "S" },
    { id: "us", nameZh: "美国", tier: "S" },
    { id: "fr", nameZh: "法国", tier: "S" },
    { id: "es", nameZh: "西班牙", tier: "S" },
    { id: "jp", nameZh: "日本", tier: "A" },
    { id: "th", nameZh: "泰国", tier: "A" },
    { id: "sg", nameZh: "新加坡", tier: "A" },
    { id: "kr", nameZh: "韩国", tier: "A" },
    { id: "au", nameZh: "澳大利亚", tier: "B" },
    { id: "ae", nameZh: "阿联酋", tier: "B" },
  ];

/** Tourism hub coords on land (pins + arcs · city SSOT · illustrative). */
export const TRAVELTRUST_PHASE1_GLOBE_REGIONS: TravelTrustPhase1GlobeRegion[] = PHASE1_REGION_META.map(
  (meta) => {
    const hub = getTraveltrustHubGeo(meta.id);
    return { id: meta.id, nameZh: meta.nameZh, tier: meta.tier, lat: hub.lat, lon: hub.lon };
  },
);

/** WGS84 lat/lon → unit sphere (Y-up). Lon sign matches Three.js equirect + `SphereGeometry` (①). */
export function latLonToUnitVector(latDeg: number, lonDeg: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (wgs84LonToGlobeSurfaceLonDeg(lonDeg) * Math.PI) / 180;
  const cosLat = Math.cos(lat);
  return [cosLat * Math.cos(lon), Math.sin(lat), cosLat * Math.sin(lon)];
}

export const PHASE1_TIER_GLOW: Record<TravelTrustPhase1GlobeRegion["tier"], string> = {
  S: TT_HERO_GLOBE_L5_PALETTE.tierGlow.S,
  A: TT_HERO_GLOBE_L5_PALETTE.tierGlow.A,
  B: TT_HERO_GLOBE_L5_PALETTE.tierGlow.B,
};
