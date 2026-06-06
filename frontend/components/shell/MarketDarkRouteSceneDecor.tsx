import {
  TT_MARKETING_DARK_ROUTE_SCENE,
  TT_MARKETING_DARK_ROUTE_SCRIM_CYAN,
  type TTMarketingDarkRouteSceneTier,
} from "@/lib/marketingUi";

/**
 * `/market` · `/community` · `/did-rank` 共用：在 `WarmRouteFieldBackdrop` 之上的 podium + 弱赛博 + 暖径向 + vignette。
 */
export default function MarketDarkRouteSceneDecor({
  tier,
}: {
  tier: TTMarketingDarkRouteSceneTier;
}) {
  const scene = TT_MARKETING_DARK_ROUTE_SCENE[tier];
  return (
    <>
      <div
        className={`fixed inset-0 z-0 bg-web3-podium-spotlight ${scene.podium} pointer-events-none`}
        aria-hidden
      />
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className={`absolute inset-0 bg-market-dark-warm-veil ${scene.warmVeil}`} />
        <div className={TT_MARKETING_DARK_ROUTE_SCRIM_CYAN} />
        <div className={`absolute inset-0 ${scene.warmRadials}`} />
        <div className={`absolute inset-0 bg-ref-silhouette-vignette ${scene.vignette}`} />
      </div>
    </>
  );
}
