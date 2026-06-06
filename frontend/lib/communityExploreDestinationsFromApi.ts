import {
  DESTINATION_BY_REGION,
  REGION_KEYS,
  type RegionKey,
} from "@/components/community/communityFeedConstants";
import type { ExploreDestinationCountRow } from "@/lib/apiClient/community";

export type ExploreRegionBlock = {
  regionKey: Exclude<RegionKey, "all">;
  destinations: readonly string[];
};

function regionKeyForDestination(destination: string): Exclude<RegionKey, "all"> | null {
  for (const key of REGION_KEYS) {
    if (key === "all") continue;
    const list = DESTINATION_BY_REGION[key];
    if (list?.includes(destination)) return key;
  }
  return null;
}

/** API 聚合目的地 → 按既有地区分组；未映射项并入 **`cn`** 区末尾（不增 UI 区块类型）。 */
export function exploreRegionBlocksFromApiAggregate(
  apiRows: ExploreDestinationCountRow[],
): ExploreRegionBlock[] {
  const countMap = new Map(apiRows.map((r) => [r.destination, r.post_count]));
  const byRegion = new Map<Exclude<RegionKey, "all">, Set<string>>();
  const unmapped: string[] = [];

  for (const row of apiRows) {
    const d = row.destination?.trim();
    if (!d) continue;
    const rk = regionKeyForDestination(d);
    if (rk) {
      if (!byRegion.has(rk)) byRegion.set(rk, new Set());
      byRegion.get(rk)!.add(d);
    } else {
      unmapped.push(d);
    }
  }

  unmapped.sort((a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0));

  return (REGION_KEYS.filter((k) => k !== "all") as Exclude<RegionKey, "all">[]).map((regionKey) => {
    const set = byRegion.get(regionKey) ?? new Set<string>();
    if (regionKey === "cn") {
      for (const d of unmapped) set.add(d);
    }
    const sorted = [...set].sort((a, b) => (countMap.get(b) ?? 0) - (countMap.get(a) ?? 0));
    return { regionKey, destinations: sorted };
  }).filter((b) => b.destinations.length > 0);
}
