"use client";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  TT_CINEMATIC_3D_DESKTOP,
  TT_CINEMATIC_3D_MOBILE,
  type TravelTrustCinematic3dConfig,
} from "./traveltrustCinematic3dConfig";
import { TravelTrustCinematicScene3DContent } from "./TravelTrustCinematicScene3DContent";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import {
  TT_LEGACY_HERO_3D_SCRIM_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";
import {
  TRAVELTRUST_CINEMATIC_CANVAS_STYLE,
  applyTravelTrustPassiveCanvasGl,
} from "./traveltrustCinematicCanvasPassive";

type Props = {
  className?: string;
};

/** Hero 电影级 3D：旅行网络球体 + 景深粒子 + 滚动淡出 + 鼠标视差 */
export function TravelTrustCinematicScene3D({ className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const scrollMv = useTravelTrustHeroScrollProgress();
  const [isMobile, setIsMobile] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [scrollStyle, setScrollStyle] = useState({ opacity: 1, transform: "translateY(0px) scale(1)" });

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
  }, []);

  useEffect(() => {
    if (!scrollMv) return;
    const apply = (t: number) => {
      const opacity = Math.max(0, 1 - t * 0.95);
      const y = -t * 56;
      const scale = 1 - t * 0.1;
      setScrollStyle({
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
      });
    };
    apply(scrollMv.get());
    return scrollMv.on("change", apply);
  }, [scrollMv]);

  const config: TravelTrustCinematic3dConfig = useMemo(
    () => (isMobile ? TT_CINEMATIC_3D_MOBILE : TT_CINEMATIC_3D_DESKTOP),
    [isMobile],
  );

  if (UNIFIED_PAGE_3D) {
    return null;
  }

  if (reduceMotion || !webglOk) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 z-[0] ${className}`}
        style={{ background: TT_LEGACY_HERO_3D_SCRIM_L5 }}
        aria-hidden
        data-tt-traveltrust-legacy-hero-3d-scrim-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      />
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[0] motion-reduce:hidden ${className}`}
      aria-hidden
      data-tt-traveltrust-cinematic-3d="1"
      data-tt-traveltrust-legacy-hero-3d-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      style={{
        opacity: scrollStyle.opacity,
        transform: scrollStyle.transform,
        willChange: "opacity, transform",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 7.2], fov: 48, near: 0.1, far: 24 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        frameloop="always"
        onCreated={({ gl }) => applyTravelTrustPassiveCanvasGl(gl)}
        style={TRAVELTRUST_CINEMATIC_CANVAS_STYLE}
      >
        <TravelTrustCinematicScene3DContent config={config} enableGlow={!isMobile} />
      </Canvas>
    </div>
  );
}
