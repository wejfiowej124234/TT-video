"use client";

import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";

/**
 * Hero 装饰 underlay（letterbox / 暖墨背板）· 固定在 WebGL 地球 **之下**（TT_Z.GLOBE_UNDERLAY）。
 * P0：unified 首屏不挂载任何垫板，避免盖住或混暗 Canvas 球区。
 */
export function TravelTrustHeroGlobeUnderlayDecor() {
  if (!UNIFIED_PAGE_3D) return null;
  return null;
}
