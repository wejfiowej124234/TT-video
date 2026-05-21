"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useLayoutEffect, useRef } from "react";
import {
  TT_HERO_SKY_WASH_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  dumpTraveltrustSkyWashNode,
  shouldTraveltrustSkyWashDebug,
  shouldTraveltrustSkyWashZProbe,
} from "@/lib/traveltrustHeroSkyWashDebug";
import { TT_Z, ttZStyle } from "@/lib/traveltrustZ";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";

/**
 * 首屏全视口暖墨天幕（`[data-tt-traveltrust-hero-sky-wash-l5]` · TT_Z.HERO_SKY_WASH）。
 * **UNIFIED_PAGE_3D `/traveltrust` 已不再挂载**（长条压地球；冷蓝改关 Hero DOM video）。
 * 保留组件供 legacy / `?tt_sky_wash_debug=1` 对照。
 */
export function TravelTrustHeroFixedInkMask() {
  const scrollFallback = useMotionValue(0);
  const heroScroll = useTravelTrustHeroScrollProgress() ?? scrollFallback;
  const opacity = useTransform(heroScroll, [0, 0.22, 0.55], [1, 1, 0]);
  const rootRef = useRef<HTMLDivElement>(null);
  const zProbe = shouldTraveltrustSkyWashZProbe();

  useLayoutEffect(() => {
    if (!shouldTraveltrustSkyWashDebug() && !zProbe) return;
    const el = rootRef.current;
    if (!el) return;
    dumpTraveltrustSkyWashNode(el);
    if (zProbe) {
      console.warn(
        "[TT sky-wash z-probe] 已强制 style zIndex=9999 position=fixed — 对比蓝块是否变化后移除 ?tt_sky_wash_z_probe=1",
      );
    }
  });

  return (
    <motion.div
      ref={rootRef}
      className={TT_HERO_SKY_WASH_L5.rootClass}
      aria-hidden
      data-tt-traveltrust-hero-sky-wash-l5="1"
      data-tt-traveltrust-hero-fixed-ink-mask-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-hero-sky-wash-z-probe={zProbe ? "1" : "0"}
      style={{
        background: TT_HERO_SKY_WASH_L5.gradient,
        opacity,
        position: "fixed",
        ...(zProbe ? { zIndex: 9999 } : ttZStyle(TT_Z.HERO_SKY_WASH)),
      }}
    />
  );
}
