"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  TT_BELOW_FOLD_ATMOSPHERE_L5,
  resolveNonGlobeSectionAtmosphere,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";
import { useTraveltrustSectionNav } from "./useTraveltrustSectionNav";
import { useTravelTrustHeroScrollProgress } from "./TravelTrustHeroScrollContext";
import { useTravelTrustPageScrollProgress } from "./TravelTrustPageScrollContext";

/** 长页滚动时与 Canvas 叙事对齐的平面环境光（L5 · 旅游暖色） */
export function TravelTrustBelowFoldAtmosphere() {
  const active = useTraveltrustSectionNav();
  const reduceMotion = useReducedMotion();
  const heroScroll = useTravelTrustHeroScrollProgress();
  const pageScroll = useTravelTrustPageScrollProgress();
  const heroT = heroScroll?.get() ?? 0;
  const pageT = pageScroll?.get() ?? 0;
  const suppressOnHero = heroT < 0.55 && pageT < 0.28;
  const background = resolveNonGlobeSectionAtmosphere(active);

  if (suppressOnHero) return null;

  return (
    <motion.div
      key={active}
      className="pointer-events-none fixed inset-0 z-[1] motion-reduce:hidden"
      aria-hidden
      data-tt-traveltrust-below-fold-atmosphere="1"
      data-tt-traveltrust-below-fold-atmosphere-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      data-tt-traveltrust-below-fold-atmosphere-section={active}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: reduceMotion ? 0 : 1 }}
      transition={{ duration: TT_BELOW_FOLD_ATMOSPHERE_L5.fadeDuration, ease: TT_BELOW_FOLD_ATMOSPHERE_L5.ease }}
      style={{ background }}
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
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(252,164,124,0.12), transparent 72%)",
          }}
        />
      ) : null}
    </motion.div>
  );
}
