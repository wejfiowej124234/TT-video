/**
 * Server-only：layout 预载与 page-brief 同源解析（①）
 * 与客户端 `fetchTravelTrustPageBrief` 共用契约，避免 layout 硬编码默认 MP4 路径。
 */

import {
  fetchTravelTrustPageBrief,
  isTravelTrustPageBriefV6,
  type TravelTrustPageBriefSource,
} from "@/lib/traveltrustPageBrief";
import {
  resolveAllRoleMediaUrls,
  resolveHeroMediaUrls,
  type HeroMediaResolution,
  type RoleMediaResolution,
} from "@/lib/traveltrustMediaFromBrief";

export type TraveltrustLayoutPreload = {
  hero: HeroMediaResolution;
  roles: RoleMediaResolution[];
  source: TravelTrustPageBriefSource;
};

export async function loadTraveltrustLayoutPreload(): Promise<TraveltrustLayoutPreload> {
  const { brief, source } = await fetchTravelTrustPageBrief();
  const v6 = isTravelTrustPageBriefV6(brief) ? brief : null;
  return {
    hero: resolveHeroMediaUrls(v6),
    roles: resolveAllRoleMediaUrls(v6),
    source,
  };
}

/** 同步 fallback：layout 首帧不 await page-brief（切换 /traveltrust 不阻塞 RSC） */
export function getTraveltrustLayoutPreloadSync(): TraveltrustLayoutPreload {
  return {
    hero: resolveHeroMediaUrls(null),
    roles: resolveAllRoleMediaUrls(null),
    source: "fallback",
  };
}
