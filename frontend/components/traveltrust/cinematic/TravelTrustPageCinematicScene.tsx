"use client";

import { TT_CINEMATIC_3D_BG, TT_CINEMATIC_FILM, type TravelTrustCinematic3dConfig } from "./traveltrustCinematic3dConfig";
import { TravelTrustCinematicBloom } from "./TravelTrustCinematicBloom";
import { CinematicHorizonBand, PageCinematicLighting } from "./TravelTrustWeb3CinematicElements";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import { PageCinematicSceneLayerDebug } from "./PageCinematicSceneLayerDebug";
import { shouldMountTraveltrustSceneLayerDebug } from "@/lib/traveltrustPageCinematicSceneDebug";
import {
  PageCameraRig,
  PageCinematicEnvironment,
  PageCinematicHeroWarmFill,
  PageCinematicWarmSkyShell,
  PageHeroGlobeRig,
} from "./page-scene";

export function TravelTrustPageCinematicScene({
  config,
  isMobile = false,
  lowQuality = false,
  showPhase1Decor = true,
  enableGlow = true,
  globeInteractive = false,
  enablePostFx = true,
  routePulseCount = TT_CINEMATIC_FILM.routePulseCountDesktop,
  heroT: heroTProp = 0,
}: {
  config: TravelTrustCinematic3dConfig;
  isMobile?: boolean;
  lowQuality?: boolean;
  showPhase1Decor?: boolean;
  enableGlow?: boolean;
  globeInteractive?: boolean;
  enablePostFx?: boolean;
  routePulseCount?: number;
  /** 由 Canvas 父级订阅 scroll 传入（避免 R3F 子树不随 heroT 重渲染） */
  heroT?: number;
}) {
  const heroSky = heroTProp < 0.58;

  return (
    <>
      <color attach="background" args={[TT_CINEMATIC_3D_BG]} />
      <fog attach="fog" args={["#0c0a09", heroSky ? 5.4 : 6, heroSky ? 12 : 16]} />
      <PageCinematicWarmSkyShell />
      <PageCinematicHeroWarmFill />
      <PageCinematicLighting />
      <PageCinematicEnvironment config={config} />
      {UNIFIED_PAGE_3D ? null : <CinematicHorizonBand />}
      <PageCameraRig isMobile={isMobile} />
      <PageHeroGlobeRig
        config={config}
        showPhase1Decor={showPhase1Decor}
        enableGlow={enableGlow}
        globeInteractive={globeInteractive}
        routePulseCount={routePulseCount}
        isMobile={isMobile}
        lowQuality={lowQuality}
        heroT={heroTProp}
      />
      {enablePostFx ? <TravelTrustCinematicBloom enabled /> : null}
      {shouldMountTraveltrustSceneLayerDebug() ? <PageCinematicSceneLayerDebug /> : null}
    </>
  );
}
