"use client";

import { Float } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { TT_CINEMATIC_FILM, type TravelTrustCinematic3dConfig } from "../traveltrustCinematic3dConfig";
import { TravelTrustPhase1TravelArcs } from "../TravelTrustPhase1TravelArcs";
import { TravelTrustHeroGlobeProjectionPublisher } from "../TravelTrustHeroGlobeProjectionPublisher";
import {
  TourismGlobeAmbientParticles,
  TravelTrustTourismGlobe,
  TravelTrustTourismGlobeFillLight,
  TravelTrustTourismGlobeSpin,
} from "../TravelTrustTourismGlobe";
import { damp, easeInOutCubic, lerp, smoothstep } from "../traveltrustCinematicEasing3d";
import { resolveTraveltrustGlobeRenderTier, TT_GLOBE_EARTH_SURFACE_RADIUS_MUL } from "@/lib/traveltrustGlobeEarthAsset";
import { TT_CINEMATIC_GLOBE_VISUAL } from "@/lib/traveltrustCinematicVisual";
import { TravelTrustGlobeInteractionProvider } from "../TravelTrustGlobeInteractionContext";
import { TravelTrustPhase1GlobeHighlights } from "../TravelTrustPhase1GlobeHighlights";
import { useTravelTrustHeroScrollProgress } from "../TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "../TravelTrustPageScrollContext";
import { useTravelTrustTheaterViewport } from "../TravelTrustTheaterViewportContext";
import { RouteTrustPulses } from "../TravelTrustWeb3CinematicElements";
import { resolveCinematicGlobeDecorFade } from "@/lib/traveltrustCinematicPageL5";
import {
  TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_ID,
  TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID,
  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,
  TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL,
} from "@/lib/traveltrustHeroGlobeBrighten";
import {
  TRAVELTRUST_HERO_GLOBE_AMBIENT_PARTICLES_ENABLED,
  TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC,
  TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC_MOBILE,
} from "@/lib/traveltrustGlobeHeroTuning";
import {
  resolveHeroGlobeEntranceProgress,
  resolveHeroGlobeEntranceScaleMul,
  resolveHeroGlobeExitProgress,
  resolveHeroGlobeOpacityExit,
  resolveHeroGlobeScaleExit,
  resolveHeroSplitLayoutBlend,
  TT_HERO_SPLIT_GLOBE_SCALE_MUL,
  TT_HERO_SPLIT_GLOBE_X,
  TT_HERO_SPLIT_GLOBE_Y,
  TT_HERO_THEATER_GLOBE_X,
  TT_HERO_THEATER_GLOBE_Y,
} from "@/lib/traveltrustHeroCinematicAlign";
import { PageTravelCorridorRing } from "./PageTravelCorridorRing";
import { PageHeroGlobeWarmShell } from "./PageHeroGlobeWarmShell";

export function PageHeroGlobeRig({
  config,
  showPhase1Decor,
  enableGlow,
  globeInteractive,
  routePulseCount,
  isMobile,
  lowQuality,
  heroT,
}: {
  config: TravelTrustCinematic3dConfig;
  showPhase1Decor: boolean;
  enableGlow: boolean;
  globeInteractive: boolean;
  routePulseCount: number;
  isMobile: boolean;
  lowQuality: boolean;
  heroT: number;
}) {
  const heroWarmInkSky = heroT < 0.58;
  const reduceMotion = useReducedMotion();
  const globeTier = resolveTraveltrustGlobeRenderTier({ isMobile, lowQuality });
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const theaterViewport = useTravelTrustTheaterViewport();
  const globeRig = useRef<Group>(null);
  const mountAtMs = useRef(performance.now());
  const entranceSm = useRef(reduceMotion ? 1 : 0);
  const entranceDurationSec = isMobile
    ? TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC_MOBILE
    : TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC;
  const ringRig = useRef<Group>(null);
  const parallax = useRef({ x: 0, y: 0 });
  const scaleSm = useRef(reduceMotion ? 1 : resolveHeroGlobeEntranceScaleMul(0) * TT_HERO_SPLIT_GLOBE_SCALE_MUL);
  useLayoutEffect(() => {
    if (globeRig.current) globeRig.current.userData.ttTraveltrustPageGlobeRig = "1";
  }, []);
  useLayoutEffect(() => {
    mountAtMs.current = performance.now();
    entranceSm.current = reduceMotion ? 1 : 0;
    scaleSm.current = reduceMotion
      ? 1
      : resolveHeroGlobeEntranceScaleMul(0) * TT_HERO_SPLIT_GLOBE_SCALE_MUL;
  }, [reduceMotion]);
  const opacitySm = useRef(1);
  const decorFadeSm = useRef(1);
  const ringYSm = useRef(-2.4);
  const ringScaleSm = useRef(0.2);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const heroT = heroScroll?.get() ?? 0;
    const pageT = pageScroll?.get() ?? 0;
    const splitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
    const heroScrollEase = easeInOutCubic(heroT);
    const decorFade = resolveCinematicGlobeDecorFade(heroT);
    decorFadeSm.current = damp(decorFadeSm.current, decorFade, delta, 1.8);
    const ringIn = smoothstep(0.32, 0.58, pageT);
    const scaleExit = easeInOutCubic(resolveHeroGlobeScaleExit(heroT));
    const opacityExit = easeInOutCubic(resolveHeroGlobeOpacityExit(heroT));
    const globeFadeOut = resolveHeroGlobeExitProgress(heroT);

    if (!reduceMotion && entranceSm.current < 0.999) {
      const elapsedSec = (performance.now() - mountAtMs.current) / 1000;
      const entranceTarget = resolveHeroGlobeEntranceProgress(elapsedSec, entranceDurationSec);
      entranceSm.current = damp(entranceSm.current, entranceTarget, delta, 2.4);
    }

    const px = -pointer.x * 0.28 * (1 - heroScrollEase * 0.65);
    const py = -pointer.y * 0.18 * (1 - heroScrollEase * 0.65);
    parallax.current.x += (px - parallax.current.x) * 0.05;
    parallax.current.y += (py - parallax.current.y) * 0.05;

    if (globeRig.current) {
      const parallaxMix = splitBlend * 0.65 + 0.35;
      const globeX = lerp(
        TT_HERO_THEATER_GLOBE_X,
        TT_HERO_SPLIT_GLOBE_X,
        splitBlend,
      ) + parallax.current.x * 0.06 * parallaxMix;
      const splitGlobeY = lerp(TT_HERO_SPLIT_GLOBE_Y, TT_HERO_SPLIT_GLOBE_Y - 0.14, scaleExit);
      const globeY = lerp(TT_HERO_THEATER_GLOBE_Y, splitGlobeY, splitBlend) + parallax.current.y * 0.06;
      globeRig.current.position.set(globeX, globeY, 0);

      const heroScaleMul = lerp(1, TT_HERO_SPLIT_GLOBE_SCALE_MUL, splitBlend);
      const scrollShrink = lerp(1, 0.84, scaleExit);
      const entranceMul = resolveHeroGlobeEntranceScaleMul(entranceSm.current);
      const targetScale = heroScaleMul * scrollShrink * entranceMul * (1 - opacityExit * 0.9);
      const scaleLambda = 0.88 + scaleExit * 0.22;
      scaleSm.current = damp(scaleSm.current, targetScale, delta, scaleLambda);
      opacitySm.current = damp(opacitySm.current, 1 - opacityExit, delta, 0.92);
      globeRig.current.scale.setScalar(scaleSm.current);

      globeRig.current.rotation.x = lerp(0.18, 0.36, heroScrollEase);
      globeRig.current.visible = opacitySm.current > 0.028;
    }

    if (ringRig.current) {
      const ringBoost = smoothstep(0.38, 0.62, pageT);
      const ringReveal = Math.max(ringIn, easeInOutCubic(globeFadeOut) * 0.92);
      ringRig.current.visible = ringReveal > 0.04;
      let ringYTarget = lerp(-2.8, -2.2, ringReveal);
      if (theaterViewport && typeof window !== "undefined") {
        const vh = window.innerHeight;
        const ndc = 1 - (theaterViewport.centerY / vh) * 2;
        ringYTarget = ndc * 1.65 - 0.15;
      }
      ringYSm.current = damp(ringYSm.current, ringYTarget, delta, 2.4);
      ringRig.current.position.y = ringYSm.current;
      ringRig.current.position.z = lerp(-0.55, -0.12, ringIn);
      const ringScaleTarget = lerp(0.2, 1.05 + ringBoost * 0.06, easeInOutCubic(ringReveal));
      ringScaleSm.current = damp(ringScaleSm.current, ringScaleTarget, delta, 2.1);
      ringRig.current.scale.setScalar(ringScaleSm.current);
      ringRig.current.rotation.x = 0.52;
      ringRig.current.rotation.y = state.clock.elapsedTime * (0.08 + ringBoost * 0.06);
    }
  });

  return (
    <>
      <group ref={globeRig} userData={{ ttTraveltrustPageGlobeRig: "1" }}>
        <Float speed={0.65} rotationIntensity={0.06} floatIntensity={0.1}>
          <group rotation={[0.18, 0.38, 0]}>
            <TravelTrustTourismGlobeFillLight radius={config.globeRadius} />
            {enableGlow &&
            TRAVELTRUST_HERO_GLOBE_AMBIENT_PARTICLES_ENABLED &&
            globeTier.ambientParticles ? (
              <TourismGlobeAmbientParticles radius={config.globeRadius} />
            ) : null}
            <TravelTrustGlobeInteractionProvider interactive={globeInteractive}>
              <TravelTrustTourismGlobeSpin config={config}>
                <group
                  userData={{
                    ttSceneDebugLayer: "ocean",
                    ttSceneDebugName: "TravelTrustTourismGlobe",
                    ttTraveltrustHeroGlobePassABrighten: TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_ID,
                    ttTraveltrustHeroGlobePassAMaterialTune: TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID,
                    ttTraveltrustHeroGlobeBrightenStep: String(TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP),
                  }}
                >
                  <TravelTrustTourismGlobe
                    config={config}
                    tier={globeTier}
                    isMobile={isMobile}
                    lowQuality={lowQuality}
                    heroWarmInkSky={heroWarmInkSky}
                  />
                  {heroWarmInkSky ? <PageHeroGlobeWarmShell radius={config.globeRadius} heroT={heroT} /> : null}
                </group>
                {showPhase1Decor ? (
                  <group userData={{ ttSceneDebugLayer: "arcs", ttSceneDebugName: "Phase1TravelArcs" }}>
                    <TravelTrustPhase1TravelArcs
                      radius={config.globeRadius}
                      lite={globeTier.travelArcLite}
                      qualityMul={
                        (lowQuality ? TT_CINEMATIC_GLOBE_VISUAL.phase1DecorLowQualityMul : 1) *
                        decorFadeSm.current *
                        TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL
                      }
                    />
                    <TravelTrustPhase1GlobeHighlights
                      radius={config.globeRadius}
                      qualityMul={
                        (lowQuality ? TT_CINEMATIC_GLOBE_VISUAL.phase1DecorLowQualityMul : 1) *
                        decorFadeSm.current *
                        TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL
                      }
                    />
                  </group>
                ) : null}
              </TravelTrustTourismGlobeSpin>
            </TravelTrustGlobeInteractionProvider>
            {enableGlow && routePulseCount > 0 && heroT > 0.22 ? (
              <RouteTrustPulses config={config} count={routePulseCount} />
            ) : null}
          </group>
        </Float>
        <TravelTrustHeroGlobeProjectionPublisher
          globeRigRef={globeRig}
          surfaceRadius={config.globeRadius * TT_GLOBE_EARTH_SURFACE_RADIUS_MUL}
        />
      </group>
      <group ref={ringRig}>
        <PageTravelCorridorRing isMobile={isMobile} />
      </group>
    </>
  );
}
