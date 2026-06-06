/**
 * Hero 左下紧凑胶囊 · 与可见枢纽对齐（非冻结 · ①）
 */
import {
  isTraveltrustHeroL5DestinationHubId,
  TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS,
} from "@/lib/traveltrustHeroL5FinalPolish";
import { traveltrustPhase1RegionNameKey } from "@/lib/traveltrustPhase1RegionKeys";
import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";

export function resolveHeroGlobeRosterHubShortLabel(
  t: (key: string) => string,
  hubId: string,
): string {
  if (isTraveltrustHeroL5DestinationHubId(hubId)) {
    return t(TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS[hubId]);
  }
  return t(traveltrustPhase1RegionNameKey(hubId));
}

/**
 * 优先用 WebGL 报告的前半球可见枢纽，避免「画面是东京、胶囊写大西洋」。
 */
export function resolveHeroGlobeCompactRosterLabel(
  t: (key: string, vars?: Record<string, string>) => string,
  routeBias: HeroGlobeRouteBias | string,
  visibleHubIds: readonly string[],
): string {
  if (visibleHubIds.length >= 2) {
    const hubs = visibleHubIds
      .slice(0, 3)
      .map((id) => resolveHeroGlobeRosterHubShortLabel(t, id))
      .join(" → ");
    return `${hubs} →`;
  }
  if (routeBias === "atlantic") return t("traveltrust_phase1_roster_compact_atlantic");
  if (routeBias === "asia") return t("traveltrust_phase1_roster_compact_asia");
  return t("traveltrust_phase1_roster_compact");
}
