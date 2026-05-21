import { TRAVELTRUST_PHASE1_GLOBE_REGIONS } from "./traveltrustPhase1GlobeRegions";

export type TraveltrustPhase1RegionLocaleKey =
  `traveltrust_phase1_region_${(typeof TRAVELTRUST_PHASE1_GLOBE_REGIONS)[number]["id"]}`;

export function traveltrustPhase1RegionNameKey(
  id: (typeof TRAVELTRUST_PHASE1_GLOBE_REGIONS)[number]["id"],
): TraveltrustPhase1RegionLocaleKey {
  return `traveltrust_phase1_region_${id}`;
}
