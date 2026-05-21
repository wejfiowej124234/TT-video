"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  TT_BELOW_FOLD_ATMOSPHERE_L5,
  TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";

/** 长页统一平面底光（不按 nav 节跳色 · 避免接缝色带） */
export function TravelTrustBelowFoldAtmosphere() {
  const reduceMotion = useReducedMotion();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const heroT = heroScroll?.get() ?? 0;
  const pageT = pageScroll?.get() ?? 0;
  const suppressOnHero = heroT < 0.55 && pageT < 0.28;

  if (suppressOnHero) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1] motion-reduce:hidden"
      aria-hidden
      data-tt-traveltrust-below-fold-atmosphere="1"
      data-tt-traveltrust-below-fold-atmosphere-l5="1"
      data-tt-traveltrust-below-fold-atmosphere-unified-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: reduceMotion ? 0 : 1 }}
      transition={{ duration: TT_BELOW_FOLD_ATMOSPHERE_L5.fadeDuration, ease: TT_BELOW_FOLD_ATMOSPHERE_L5.ease }}
      style={{ background: TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5.background }}
    >
      {!reduceMotion ? (
        <motion.div
          className="absolute inset-0"
          aria-hidden
          animate={{ opacity: TT_BELOW_FOLD_ATMOSPHERE_L5.warmPulseOpacity }}
          transition={{
            duration: TT_BELOW_FOLD_ATMOSPHERE_L5.warmPulseDuration,
            repeat: TT_BELOW_FOLD_ATMOSPHERE_L5.warmPulseRepeat,
            ease: "easeInOut",
          }}
          style={{ background: TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5.warmPulseBackground }}
        />
      ) : null}
    </motion.div>
  );
}
