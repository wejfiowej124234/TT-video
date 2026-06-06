"use client";

import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";
import MarketDarkRouteSceneDecor from "@/components/shell/MarketDarkRouteSceneDecor";
import {
  resolveCommunityBackdropSurface,
  resolveCommunityDarkRouteSceneTier,
} from "@/lib/marketingDarkPremiumBg";

/** TT 社区页身底（① 试色 · 高级近黑） */
export default function CommunityAmbientBackdrop() {
  const surface = resolveCommunityBackdropSurface();
  const sceneTier = resolveCommunityDarkRouteSceneTier(surface);

  return (
    <div data-tt-community-dark-surface={surface} data-tt-community-dark-scene-tier={sceneTier}>
      <WarmRouteFieldBackdrop
        surface={surface}
        atmosphereClass={
          surface === "premium" ? "bg-traveltrust-atmosphere-community-premium" : undefined
        }
      />
      <MarketDarkRouteSceneDecor tier={sceneTier} />
    </div>
  );
}
