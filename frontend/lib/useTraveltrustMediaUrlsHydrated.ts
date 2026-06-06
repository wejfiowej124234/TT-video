"use client";

import { useEffect, useState } from "react";
import type { TravelTrustRoleConfig } from "@/app/traveltrust/traveltrustIdentityModel";
import type { TravelTrustPageBrief } from "@/lib/traveltrustPageBrief";
import {
  resolveHeroMediaUrls,
  resolveRoleMediaUrls,
  type HeroMediaResolution,
  type HeroMediaTier,
  type RoleMediaResolution,
} from "@/lib/traveltrustMediaFromBrief";

const SSR_SAFE_TIER: HeroMediaTier = "tier1-placeholder";

function useMediaHydrationSettled(): boolean {
  const [hydrationSettled, setHydrationSettled] = useState(false);
  useEffect(() => {
    setHydrationSettled(true);
  }, []);
  return hydrationSettled;
}

/**
 * 避免剧场视频 SSR/客户端 tier 不一致（dev 下 NEXT_PUBLIC 构建与运行时 env 不同步）。
 * 首屏与 SSR 固定 tier1-placeholder；hydration 后再应用 THEATER_MEDIA_MODE / ROLE_VIDEO_*。
 */
export function useRoleMediaUrlsHydrated(
  role: TravelTrustRoleConfig,
  brief: TravelTrustPageBrief | null,
): { media: RoleMediaResolution; hydrationSettled: boolean } {
  const resolved = resolveRoleMediaUrls(role, brief);
  const hydrationSettled = useMediaHydrationSettled();
  const media: RoleMediaResolution = hydrationSettled
    ? resolved
    : { ...resolved, tier: SSR_SAFE_TIER };
  return { media, hydrationSettled };
}

/** Hero loop tier · 与剧场同源 hydration 安全策略 */
export function useHeroMediaUrlsHydrated(brief: TravelTrustPageBrief | null): {
  media: HeroMediaResolution;
  hydrationSettled: boolean;
} {
  const resolved = resolveHeroMediaUrls(brief);
  const hydrationSettled = useMediaHydrationSettled();
  const media: HeroMediaResolution = hydrationSettled
    ? resolved
    : { ...resolved, tier: SSR_SAFE_TIER };
  return { media, hydrationSettled };
}
