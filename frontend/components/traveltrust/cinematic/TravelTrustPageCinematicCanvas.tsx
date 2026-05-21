"use client";

import { useTexture } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import {
  TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH,
  TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH,
} from "@/lib/traveltrustGlobeEarthAsset";

void useTexture.preload(TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH, undefined, undefined, "anonymous");
void useTexture.preload(TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH, undefined, undefined, "anonymous");
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  initTraveltrustCinematicQualityPrefs,
  isTraveltrustCinematicLowQuality,
  scheduleTraveltrustWebGLMount,
} from "@/lib/traveltrustCinematicPerf";
import { TT_HERO_GLOBE_OPTICAL_FALLBACK } from "@/lib/traveltrustHeroGlobeAlign";
import { smoothstep } from "./traveltrustCinematicEasing3d";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";
import {
  TT_CINEMATIC_3D_BG,
  TT_CINEMATIC_3D_DESKTOP,
  TT_CINEMATIC_3D_LOW,
  TT_CINEMATIC_3D_MOBILE,
  TT_CINEMATIC_FILM,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import {
  applyTravelTrustPageCinematicGl,
  buildTraveltrustCinematicCanvasStyle,
} from "./traveltrustCinematicCanvasPassive";
import {
  buildHeroFixedInkMaskImage,
  buildHeroOuterSkyCanvasOverlayLayers,
  buildHeroWarmSkyBaseBackground,
  buildWarmPageCinematicCanvasOverlayLayers,
  resolveNonGlobeCanvasCyanMul,
  resolveNonGlobeCanvasScrollOpacity,
  resolveNonGlobeMobileBloomEnabled,
  resolveNonGlobeScrollWarmBandPeak,
  TT_CANVAS_LAYER_L5,
  TT_CANVAS_STATIC_FALLBACK_L5,
  TT_CANVAS_WARM_BAND_L5,
  TT_CINEMATIC_PAGE_INK_HEX,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_ID,
  TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID,
} from "@/lib/traveltrustHeroGlobeBrighten";
import { resolveTraveltrustCanvasPower } from "@/lib/traveltrustCinematicPower";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import { bindTravelTrustWebGLContextHandlers } from "./traveltrustWebGLContext";
import { TravelTrustCinematicFallbackNotice } from "./TravelTrustCinematicFallbackNotice";
import {
  TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_BASE,
  TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_FULL_LG,
} from "@/lib/marketingUi";
import { resolveHeroSplitLayoutBlend } from "@/lib/traveltrustHeroCinematicAlign";
import { PageCinematicSceneDebugHud } from "./PageCinematicSceneLayerDebug";

const TravelTrustPageCinematicScene = dynamic(
  () =>
    import("./TravelTrustPageCinematicScene").then((m) => ({
      default: m.TravelTrustPageCinematicScene,
    })),
  { ssr: false },
);

function CinematicStaticFallback() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1] motion-reduce:hidden"
      aria-hidden
      data-tt-traveltrust-page-cinematic-fallback="1"
      data-tt-traveltrust-page-cinematic-fallback-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: TT_CANVAS_STATIC_FALLBACK_L5.fadeInDuration }}
      style={{
        background: [...TT_CANVAS_STATIC_FALLBACK_L5.layers, TT_CINEMATIC_3D_BG].join(", "),
      }}
    >
      <motion.div
        className="absolute inset-0"
        aria-hidden
        animate={{ opacity: TT_CANVAS_STATIC_FALLBACK_L5.warmOpacityRange }}
        transition={{
          duration: TT_CANVAS_STATIC_FALLBACK_L5.warmPulseDuration,
          repeat: TT_CANVAS_STATIC_FALLBACK_L5.warmPulseRepeat,
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(ellipse 72% 58% at 50% 42%, rgba(252,164,124,0.14), transparent 72%)",
        }}
      />
    </motion.div>
  );
}

/** 全页固定 3D 层：滚动时球体坠入剧场（UNIFIED_PAGE_3D） */
export function TravelTrustPageCinematicCanvas() {
  const reduceMotion = useReducedMotion();
  const pageScroll = useTravelTrustPageScrollProgress();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [heroT, setHeroT] = useState(0);
  const [pageT, setPageT] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [webglLost, setWebglLost] = useState(false);
  const [mountReady, setMountReady] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [entered, setEntered] = useState(false);
  const [enterDone, setEnterDone] = useState(false);
  const { focusedRegionId: globeP1FocusedRegionId } = useHeroGlobeP1Link();
  const [tabVisible, setTabVisible] = useState(true);
  const [heroInView, setHeroInView] = useState(true);
  const [rolesInView, setRolesInView] = useState(false);
  const [trustInView, setTrustInView] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const lowQuality = isTraveltrustCinematicLowQuality();
  const bloomEnvOn =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRAVELTRUST_CINEMATIC_BLOOM === "1";
  const bloomEnvOff =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_TRAVELTRUST_CINEMATIC_BLOOM === "0";
  const bloomBase =
    !bloomEnvOff && !lowQuality && (bloomEnvOn || !isMobile) && heroT < 0.92 && (heroInView || rolesInView);
  const bloomEnabled = resolveNonGlobeMobileBloomEnabled(isMobile, heroT, pageT, bloomBase);
  const globeInteractive =
    !reduceMotion && !isMobile && !lowQuality && heroT < 0.92 && heroInView;
  const canvasStyle = useMemo(
    () => buildTraveltrustCinematicCanvasStyle(globeInteractive),
    [globeInteractive],
  );

  useEffect(() => {
    initTraveltrustCinematicQualityPrefs();
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    return scheduleTraveltrustWebGLMount(() => setMountReady(true), mobile ? 320 : 140);
  }, []);

  useEffect(() => {
    if (!heroScroll) return;
    setHeroT(heroScroll.get());
    return heroScroll.on("change", setHeroT);
  }, [heroScroll]);

  useEffect(() => {
    if (!pageScroll) return;
    setPageT(pageScroll.get());
    return pageScroll.on("change", setPageT);
  }, [pageScroll]);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      if (!(c.getContext("webgl2") ?? c.getContext("webgl"))) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  const config: TravelTrustCinematic3dConfig = useMemo(() => {
    if (lowQuality) return TT_CINEMATIC_3D_LOW;
    return isMobile ? TT_CINEMATIC_3D_MOBILE : TT_CINEMATIC_3D_DESKTOP;
  }, [isMobile, lowQuality]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    const done = window.setTimeout(() => setEnterDone(true), 1200);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(done);
    };
  }, []);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState !== "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setHeroInView(entry?.isIntersecting ?? false),
      { root: null, rootMargin: "0px 0px -35% 0px", threshold: 0.02 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [webglOk]);

  useEffect(() => {
    const roles = document.getElementById("roles");
    if (!roles) return;
    const io = new IntersectionObserver(
      ([entry]) => setRolesInView(entry?.isIntersecting ?? false),
      { root: null, rootMargin: "-8% 0px -45% 0px", threshold: 0.06 },
    );
    io.observe(roles);
    return () => io.disconnect();
  }, [webglOk]);

  useEffect(() => {
    const trust = document.getElementById("trust");
    if (!trust) return;
    const io = new IntersectionObserver(
      ([entry]) => setTrustInView(entry?.isIntersecting ?? false),
      { root: null, rootMargin: "-12% 0px -40% 0px", threshold: 0.08 },
    );
    io.observe(trust);
    return () => io.disconnect();
  }, [webglOk]);

  useEffect(() => {
    if (!pageScroll) return;
    let raf = 0;
    const apply = (t: number) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const fade = resolveNonGlobeCanvasScrollOpacity(t);
        setScrollOpacity((prev) => (Math.abs(prev - fade) < 0.02 ? prev : fade));
      });
    };
    apply(pageScroll.get());
    const unsub = pageScroll.on("change", apply);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [pageScroll]);

  /** P0：Hero 叙事区零 CSS 垫板/叠层/特效，地球仅由 WebGL 绘制（与 showPhase1Decor 同阈） */
  const heroGlobeUnobstructed = heroT < 0.92;

  const power = resolveTraveltrustCanvasPower({
    tabVisible,
    heroInView,
    rolesInView,
    trustInView,
    scrollOpacity,
    heroT,
    pageT,
  });
  /** P0 首屏：即使 IO 暂判离屏也保持跑帧，避免 `frameloop=never` 导致「无地球」 */
  const canvasActive = power.active || heroGlobeUnobstructed;
  const shouldRunFrames = canvasActive || !enterDone;
  const heroSplitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
  /** 全宽 Canvas + 3D 位移/遮罩插值（TT-PH1-150）；勿再叠 CSS mask / split 硬切，易丢球或乱版 */
  const cinematicViewportClass = `${TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_BASE} ${TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_FULL_LG}`;
  const globeOpticalX = `var(--tt-hero-globe-optical-x, calc(50% + (${TT_HERO_GLOBE_OPTICAL_FALLBACK} - 50%) * ${heroSplitBlend.toFixed(3)}))`;
  const heroBridgeFade =
    heroT < 0.38 ? 0 : heroT > 0.9 ? Math.max(0, 1 - (heroT - 0.9) / 0.1) : (heroT - 0.38) / 0.52;
  const heroBridgeEase = heroBridgeFade * heroBridgeFade * (3 - 2 * heroBridgeFade);
  const trustBand =
    pageT <= 0.38
      ? 0
      : pageT >= 0.82
        ? 0
        : smoothstep(0.38, 0.5, pageT) * (1 - smoothstep(0.68, 0.82, pageT));
  /** 首屏不叠 outer-ring CSS（蓝带已删 video；该层 + sky-cap/veil 曾整屏盖住地球） */
  const heroOuterRingOverlay = false;
  const canvasOverlayBackground = useMemo(() => {
    if (heroOuterRingOverlay) {
      return buildHeroOuterSkyCanvasOverlayLayers(globeOpticalX);
    }
    return buildWarmPageCinematicCanvasOverlayLayers({
      heroT,
      pageT,
      heroSplitBlend,
      heroBridgeEase,
      trustBand,
      globeOpticalX,
      cyanMul: resolveNonGlobeCanvasCyanMul(heroT, pageT),
    }).join(", ");
  }, [heroT, pageT, heroSplitBlend, heroBridgeEase, trustBand, globeOpticalX, heroOuterRingOverlay]);
  const canvasWarmBaseBackground = useMemo(
    () => (heroT < 0.55 ? buildHeroWarmSkyBaseBackground(globeOpticalX) : "#0c0a09"),
    [heroT, globeOpticalX],
  );
  if (!UNIFIED_PAGE_3D || reduceMotion) return null;

  if (!mountReady) {
    return (
      <>
        <CinematicStaticFallback />
        <TravelTrustCinematicFallbackNotice reason="loading" />
      </>
    );
  }

  if (!webglOk) {
    return (
      <>
        <CinematicStaticFallback />
        <TravelTrustCinematicFallbackNotice reason="unsupported" />
      </>
    );
  }

  if (webglLost) {
    return (
      <>
        <CinematicStaticFallback />
        <TravelTrustCinematicFallbackNotice reason="lost" />
      </>
    );
  }

  return (
    <motion.div
      ref={layerRef}
      className={cinematicViewportClass}
      aria-hidden
      data-tt-traveltrust-page-cinematic-3d="1"
      data-tt-traveltrust-cinematic-l5="TT-CINEMATIC-L5-2026-05"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-page-cinematic-split={heroSplitBlend > 0.08 ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-split-blend={heroSplitBlend.toFixed(3)}
      data-tt-traveltrust-page-cinematic-canvas-split={heroSplitBlend > 0.5 ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-inview={heroInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-roles-inview={rolesInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-trust-inview={trustInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-power={canvasActive ? "active" : "idle"}
      data-tt-traveltrust-page-cinematic-frameloop={shouldRunFrames ? "always" : "never"}
      data-tt-traveltrust-page-cinematic-power-reason={power.reason}
      data-tt-traveltrust-page-cinematic-low={lowQuality ? "1" : "0"}
      data-tt-traveltrust-globe-interactive={globeInteractive ? "1" : "0"}
      data-tt-traveltrust-webgl-lost={webglLost ? "1" : "0"}
      data-tt-traveltrust-hero-t={heroT.toFixed(3)}
      data-tt-traveltrust-hero-warm-ink-sky={heroT < 0.58 ? "1" : "0"}
      data-tt-traveltrust-hero-globe-pass-a-brighten={heroT < 0.58 ? TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_ID : "0"}
      data-tt-traveltrust-hero-globe-pass-a-material-tune={
        heroT < 0.58 ? TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID : "0"
      }
      data-tt-traveltrust-hero-canvas-overlay-empty={heroOuterRingOverlay ? "0" : heroGlobeUnobstructed ? "1" : "0"}
      data-tt-traveltrust-hero-canvas-overlay-mode={heroOuterRingOverlay ? "outer-ring" : "warm-page"}
      data-tt-traveltrust-hero-globe-unobstructed={heroGlobeUnobstructed ? "1" : "0"}
      data-tt-traveltrust-globe-focused-region={globeP1FocusedRegionId ?? ""}
      data-tt-traveltrust-globe-earth-source="jpeg"
      initial={false}
      animate={{ opacity: heroGlobeUnobstructed ? 1 : entered ? scrollOpacity : 0 }}
      transition={
        heroGlobeUnobstructed
          ? { duration: 0 }
          : {
              duration: enterDone ? TT_CANVAS_LAYER_L5.scrollOpacitySettled : TT_CANVAS_LAYER_L5.scrollOpacityEnter,
              ease: TT_CANVAS_LAYER_L5.warmBandEase,
            }
      }
    >
      {!heroGlobeUnobstructed ? (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
          data-tt-traveltrust-canvas-warm-base-l5="1"
          style={{ background: canvasWarmBaseBackground }}
        />
      ) : null}
      <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0.4, 7.55], fov: 47, near: 0.1, far: 28 }}
        gl={{
          alpha: false,
          antialias: !lowQuality,
          powerPreference: lowQuality ? "default" : "high-performance",
        }}
        dpr={lowQuality ? [1, 1.25] : isMobile ? [1, 1.5] : [1, 2]}
        frameloop={shouldRunFrames ? "always" : "never"}
        onCreated={({ gl }) => {
          applyTravelTrustPageCinematicGl(gl, { interactive: globeInteractive });
          return bindTravelTrustWebGLContextHandlers(gl.domElement, () => setWebglLost(true));
        }}
        style={canvasStyle}
      >
        <TravelTrustPageCinematicScene
          config={config}
          isMobile={isMobile}
          lowQuality={lowQuality}
          heroT={heroT}
          showPhase1Decor={heroT < 0.92 || trustBand > 0.12}
          enableGlow={!isMobile && !lowQuality && (heroT < 0.92 || trustBand > 0.12)}
          globeInteractive={globeInteractive}
          enablePostFx={!isMobile && bloomEnabled && heroT > 0.58}
          routePulseCount={TT_CINEMATIC_FILM.routePulseCountDesktop}
        />
      </Canvas>
      </div>
      {heroOuterRingOverlay && canvasOverlayBackground ? (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          aria-hidden
          data-tt-traveltrust-canvas-overlay-l5="outer-ring-ink"
          style={{
            background: canvasOverlayBackground,
            WebkitMaskImage: buildHeroFixedInkMaskImage(globeOpticalX),
            maskImage: buildHeroFixedInkMaskImage(globeOpticalX),
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            WebkitMaskComposite: "add",
            maskComposite: "add",
          }}
        />
      ) : !heroOuterRingOverlay && !heroGlobeUnobstructed && canvasOverlayBackground ? (
        <motion.div
          className="pointer-events-none absolute inset-0 z-[2]"
          aria-hidden
          data-tt-traveltrust-canvas-overlay-l5="warm-page-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: entered ? 1 : 0 }}
          transition={{
            duration: TT_CANVAS_LAYER_L5.overlayFadeDuration,
            ease: TT_CANVAS_LAYER_L5.warmBandEase,
          }}
          style={{ background: canvasOverlayBackground }}
        />
      ) : null}
      {!heroGlobeUnobstructed && heroBridgeEase > 0.08 ? (
        <motion.div
          className={TT_CANVAS_LAYER_L5.heroBridgeShimmerClass}
          aria-hidden
          data-tt-traveltrust-canvas-hero-bridge-shimmer-l5="1"
          initial={{ x: "-40%", opacity: 0 }}
          animate={{ x: "140%", opacity: heroBridgeEase * 0.85 }}
          transition={{
            x: {
              duration: TT_CANVAS_LAYER_L5.heroBridgeShimmerDuration,
              repeat: TT_CANVAS_LAYER_L5.heroBridgeShimmerRepeat,
              ease: "easeInOut",
            },
            opacity: { duration: TT_CANVAS_LAYER_L5.warmBandOpacityFadeDuration, ease: TT_CANVAS_LAYER_L5.warmBandEase },
          }}
        />
      ) : null}
      {!heroGlobeUnobstructed ? (
        <motion.div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          data-tt-traveltrust-canvas-warm-band-l5="1"
          animate={{
            opacity: (() => {
              if (heroT < 0.55) return 0;
              const peak = resolveNonGlobeScrollWarmBandPeak(heroT, pageT);
              if (peak <= 0.04) return peak * 0.085;
              return [
                peak * TT_CANVAS_WARM_BAND_L5.opacityMulRange[0],
                peak * TT_CANVAS_WARM_BAND_L5.opacityMulRange[1],
                peak * TT_CANVAS_WARM_BAND_L5.opacityMulRange[0],
              ];
            })(),
          }}
          transition={
            resolveNonGlobeScrollWarmBandPeak(heroT, pageT) > 0.04
              ? {
                  duration: TT_CANVAS_WARM_BAND_L5.pulseDuration,
                  repeat: TT_CANVAS_WARM_BAND_L5.pulseRepeat,
                  ease: "easeInOut",
                }
              : { duration: TT_CANVAS_LAYER_L5.warmBandFadeDuration, ease: TT_CANVAS_LAYER_L5.warmBandEase }
          }
          style={{
            background: TT_CINEMATIC_PAGE_INK_HEX,
          }}
        />
      ) : null}
      <PageCinematicSceneDebugHud />
    </motion.div>
  );
}
