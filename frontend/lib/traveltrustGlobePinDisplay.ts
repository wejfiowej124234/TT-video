/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import type { TravelTrustPhase1GlobeRegion } from "@/lib/traveltrustPhase1GlobeRegions";

/** Hub on land — shared by pins and great-circle arcs (L5 · avoids sea-to-sea chords). */
export function resolveTraveltrustHubLatLon(region: TravelTrustPhase1GlobeRegion): {
  lat: number;
  lon: number;
} {
  if (region.pinLat != null && region.pinLon != null) {
    return { lat: region.pinLat, lon: region.pinLon };
  }
  return { lat: region.lat, lon: region.lon };
}

/** @deprecated use resolveTraveltrustHubLatLon */
export const resolveTraveltrustPinLatLon = resolveTraveltrustHubLatLon;
