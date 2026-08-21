import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "@/lib/traveltrustPhase1GlobeRegions";
import { TRAVELTRUST_PHASE1_TRAVEL_ROUTES } from "@/lib/traveltrustPhase1TravelRoutes";

const REGION_NAME = Object.fromEntries(
  TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((r) => [r.id, r.nameZh]),
) as Record<string, string>;

/** Whether a decorative route id touches a hub (L5 arc hover). */
export function traveltrustRouteTouchesRegion(routeId: string, regionId: string): boolean {
  const route = TRAVELTRUST_PHASE1_TRAVEL_ROUTES.find((r) => r.id === routeId);
  if (!route) return false;
  return route.fromId === regionId || route.toId === regionId;
}

export type TraveltrustRegionRouteLabel = { id: string; label: string };

/** Illustrative corridors touching a hub (① · L5 hover). `id` = route id (keys must be unique; labels may repeat for A↔B pairs). */
export function listTraveltrustRoutesForRegion(regionId: string): TraveltrustRegionRouteLabel[] {
  return TRAVELTRUST_PHASE1_TRAVEL_ROUTES.filter(
    (route) => route.fromId === regionId || route.toId === regionId,
  ).map((route) => {
    const otherId = route.fromId === regionId ? route.toId : route.fromId;
    const other = REGION_NAME[otherId] ?? otherId;
    return {
      id: route.id,
      label: `${REGION_NAME[regionId] ?? regionId} → ${other}`,
    };
  });
}
