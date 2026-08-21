/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */
import { isTraveltrustHubGeoId, resolveTraveltrustHubLatLonById } from "@/lib/traveltrustHubGeo";
import type { TravelTrustPhase1GlobeRegion } from "@/lib/traveltrustPhase1GlobeRegions";

/** Hub on land — shared by pins, arcs, P3 labels/light points (SSOT · `traveltrustHubGeo.ts`). */
export function resolveTraveltrustHubLatLon(region: TravelTrustPhase1GlobeRegion): {
  lat: number;
  lon: number;
} {
  if (isTraveltrustHubGeoId(region.id)) {
    return resolveTraveltrustHubLatLonById(region.id);
  }
  return { lat: region.lat, lon: region.lon };
}

/** @deprecated use resolveTraveltrustHubLatLon */
export const resolveTraveltrustPinLatLon = resolveTraveltrustHubLatLon;
