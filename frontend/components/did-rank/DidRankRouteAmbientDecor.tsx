import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";
import MarketDarkRouteSceneDecor from "@/components/shell/MarketDarkRouteSceneDecor";
import {
  resolveDidRankBackdropSurface,
  resolveDidRankDarkRouteSceneTier,
} from "@/lib/marketingDarkPremiumBg";

/**
 * `/did-rank` 与 `loading.tsx` 共用：premium 近黑底 + 叠层（与 `MarketAmbientBackdrop` 同族）。
 */
export function DidRankRouteAmbientDecor() {
  const surface = resolveDidRankBackdropSurface();
  const sceneTier = resolveDidRankDarkRouteSceneTier(surface);

  return (
    <div data-tt-did-rank-dark-surface={surface} data-tt-did-rank-dark-scene-tier={sceneTier}>
      <WarmRouteFieldBackdrop surface={surface} />
      <MarketDarkRouteSceneDecor tier={sceneTier} />
    </div>
  );
}
