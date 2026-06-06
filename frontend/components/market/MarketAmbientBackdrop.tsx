"use client";

import { memo } from "react";
import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";
import MarketDarkRouteSceneDecor from "@/components/shell/MarketDarkRouteSceneDecor";
import {
  resolveMarketBackdropSurface,
  resolveMarketDarkRouteSceneTier,
} from "@/lib/marketingDarkPremiumBg";

/**
 * 自由市场页身底：`WarmRouteFieldBackdrop` + 叠层。
 * V2 默认 premium 近黑；回退暖褐：`NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG=0`。
 */
function MarketAmbientBackdrop() {
  const surface = resolveMarketBackdropSurface();
  const sceneTier = resolveMarketDarkRouteSceneTier(surface);

  return (
    <div data-tt-market-dark-surface={surface} data-tt-market-dark-scene-tier={sceneTier}>
      <WarmRouteFieldBackdrop surface={surface} />
      <MarketDarkRouteSceneDecor tier={sceneTier} />
    </div>
  );
}

export default memo(MarketAmbientBackdrop);
