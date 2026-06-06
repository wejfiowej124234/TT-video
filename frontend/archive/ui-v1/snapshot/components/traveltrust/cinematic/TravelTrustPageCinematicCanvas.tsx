"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  initTraveltrustCinematicQualityPrefs,
  isTraveltrustCinematicLowQuality,
  scheduleTraveltrustWebGLMount,
} from "@/lib/traveltrustCinematicPerf";
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
const TravelTrustPageCinematicScene = dynamic(
  () =>
    import("./TravelTrustPageCinematicScene").then((m) => ({
      default: m.TravelTrustPageCinematicScene,
    })),
  { ssr: false },
);
import {
  TRAVELTRUST_CINEMATIC_CANVAS_STYLE,
  applyTravelTrustPassiveCanvasGl,
} from "./traveltrustCinematicCanvasPassive";
import { TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY } from "./traveltrustHeroFilmStyles";
import { resolveTraveltrustCanvasPower } from "@/lib/traveltrustCinematicPower";
import { bindTravelTrustWebGLContextHandlers } from "./traveltrustWebGLContext";
import { TravelTrustCinematicFallbackNotice } from "./TravelTrustCinematicFallbackNotice";
import {
  TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_BASE,
  TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_FULL_LG,
} from "@/lib/marketingUi";
import { resolveHeroSplitLayoutBlend } from "@/lib/traveltrustHeroCinematicAlign";

function CinematicStaticFallback() {
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1] motion-reduce:hidden"
      aria-hidden
      data-tt-traveltrust-page-cinematic-fallback="1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        background: [
          "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(35,206,217,0.12), transparent 70%)",
          "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(10,15,13,0.2), rgba(10,15,13,0.72) 100%)",
          TT_CINEMATIC_3D_BG,
        ].join(", "),
      }}
    />
  );
}

/** 全页固定 3D 层：滚动时球体坠入剧场（UNIFIED_PAGE_3D） */
export function TravelTrustPageCinematicCanvas() {
  const reduceMotion = useReducedMotion();
  const pageScroll = useTravelTrustPageScrollProgress();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const [heroT, setHeroT] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [webglLost, setWebglLost] = useState(false);
  const [mountReady, setMountReady] = useState(false);
  const [scrollOpacity, setScrollOpacity] = useState(1);
  const [entered, setEntered] = useState(false);
  const [enterDone, setEnterDone] = useState(false);
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
  const bloomEnabled =
    !bloomEnvOff && !lowQuality && (bloomEnvOn || !isMobile) && heroT < 0.92 && (heroInView || rolesInView);

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
        const fade = t > 0.82 ? Math.max(0.35, 1 - (t - 0.82) * 3.2) : 1;
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

  const pageT = pageScroll?.get() ?? 0;
  const power = resolveTraveltrustCanvasPower({
    tabVisible,
    heroInView,
    rolesInView,
    trustInView,
    scrollOpacity,
    heroT,
    pageT,
  });
  const canvasActive = power.active;
  /** 入场 1.2s 内强制跑帧，避免 `frameloop=never` 时首帧未绘制（截图「无地球」） */
  const shouldRunFrames = canvasActive || !enterDone;
  const heroSplitBlend = resolveHeroSplitLayoutBlend(heroT, isMobile);
  /** 全宽 Canvas + 3D 位移/遮罩插值；避免 split↔full 类名硬切导致地球「跳位」（TT-PH1-150） */
  const cinematicViewportClass = `${TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_BASE} ${TT_MARKETING_TRAVELTRUST_CINEMATIC_LAYER_FULL_LG}`;
  const globeOpticalX = `var(--tt-hero-globe-optical-x, calc(50% + (28% - 50%) * ${heroSplitBlend.toFixed(3)}))`;
  const heroBridgeFade =
    heroT < 0.38 ? 0 : heroT > 0.9 ? Math.max(0, 1 - (heroT - 0.9) / 0.1) : (heroT - 0.38) / 0.52;
  const heroBridgeEase = heroBridgeFade * heroBridgeFade * (3 - 2 * heroBridgeFade);
  const trustBand =
    pageT <= 0.38
      ? 0
      : pageT >= 0.82
        ? 0
        : smoothstep(0.38, 0.5, pageT) * (1 - smoothstep(0.68, 0.82, pageT));

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
      data-tt-traveltrust-page-cinematic-split={heroSplitBlend > 0.08 ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-split-blend={heroSplitBlend.toFixed(3)}
      data-tt-traveltrust-page-cinematic-canvas-split={heroSplitBlend > 0.5 ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-inview={heroInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-roles-inview={rolesInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-trust-inview={trustInView ? "1" : "0"}
      data-tt-traveltrust-page-cinematic-power={canvasActive ? "active" : "idle"}
      data-tt-traveltrust-page-cinematic-power-reason={power.reason}
      data-tt-traveltrust-page-cinematic-low={lowQuality ? "1" : "0"}
      data-tt-traveltrust-webgl-lost={webglLost ? "1" : "0"}
      initial={false}
      animate={{ opacity: entered ? scrollOpacity : 0 }}
      transition={{ duration: enterDone ? 0.35 : 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <Canvas
        camera={{ position: [0, 0.4, 7.55], fov: 47, near: 0.1, far: 28 }}
        gl={{ alpha: true, antialias: !lowQuality, powerPreference: lowQuality ? "default" : "high-performance" }}
        dpr={lowQuality ? [1, 1.25] : isMobile ? [1, 1.5] : [1, 2]}
        frameloop={shouldRunFrames ? "always" : "never"}
        onCreated={({ gl }) => {
          applyTravelTrustPassiveCanvasGl(gl);
          return bindTravelTrustWebGLContextHandlers(gl.domElement, () => setWebglLost(true));
        }}
        style={TRAVELTRUST_CINEMATIC_CANVAS_STYLE}
      >
        <TravelTrustPageCinematicScene
          config={config}
          isMobile={isMobile}
          enableGlow={!isMobile && !lowQuality && (heroT < 0.92 || trustBand > 0.12)}
          enablePostFx={!isMobile && bloomEnabled}
          routePulseCount={
            lowQuality
              ? 1
              : isMobile
                ? TT_CINEMATIC_FILM.routePulseCountMobile
                : TT_CINEMATIC_FILM.routePulseCountDesktop
          }
        />
      </Canvas>
      <motion.div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 1 : 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: [
            ...TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY,
            `radial-gradient(ellipse 88% 72% at ${globeOpticalX} var(--tt-hero-globe-optical-y,52%), transparent 52%, rgba(10,15,13,0.06) 100%)`,
            `linear-gradient(90deg, transparent 0%, transparent ${(58 + (1 - heroSplitBlend) * 8).toFixed(0)}%, rgba(10,15,13,${(0.12 + heroSplitBlend * 0.1).toFixed(2)}) ${(72 + (1 - heroSplitBlend) * 10).toFixed(0)}%, rgba(10,15,13,${(0.35 + heroSplitBlend * 0.2).toFixed(2)}) 100%)`,
            `linear-gradient(to bottom, transparent ${(72 - heroBridgeEase * 18).toFixed(0)}%, rgba(3,7,18,${(heroBridgeEase * 0.32).toFixed(3)}) ${(88 - heroBridgeEase * 6).toFixed(0)}%, transparent 100%)`,
            "linear-gradient(to bottom, transparent 88%, rgba(10,15,13,0.06) 100%)",
            "radial-gradient(ellipse 62% 48% at 82% 46%, rgba(35,206,217,0.07) 0%, transparent 62%)",
            "linear-gradient(135deg, rgba(35,206,217,0.05) 0%, transparent 48%, rgba(110,231,183,0.025) 100%)",
            `radial-gradient(ellipse 58% 42% at 72% 38%, rgba(35,206,217,${(0.11 * trustBand).toFixed(3)}) 0%, transparent 68%)`,
          ].join(", "),
        }}
      />
    </motion.div>
  );
}
