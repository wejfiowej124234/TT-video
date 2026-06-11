"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  TT_HERO_REDUCE_MOTION_STARS_L5,
  TT_HERO_REDUCE_MOTION_STARS_L5_BG,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

/** 减动效时替代 WebGL 的 CSS 星野 + 暖光晕（L5 · 非地球 3D） */
export function TravelTrustHeroReduceMotionStars() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[0] overflow-hidden"
      aria-hidden
      data-tt-traveltrust-hero-reduce-motion-stars="1"
      data-tt-traveltrust-hero-reduce-motion-stars-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      style={{
        background: TT_HERO_REDUCE_MOTION_STARS_L5_BG,
        backgroundSize:
          "auto, auto, auto, auto, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, auto",
      }}
      animate={reduceMotion ? undefined : { opacity: [...TT_HERO_REDUCE_MOTION_STARS_L5.warmOpacityRange] }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: TT_HERO_REDUCE_MOTION_STARS_L5.warmPulseDuration,
              repeat: TT_HERO_REDUCE_MOTION_STARS_L5.warmPulseRepeat,
              ease: "easeInOut",
            }
      }
    >
      {!reduceMotion
        ? TT_HERO_REDUCE_MOTION_STARS_L5.twinkles.map((twinkle, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute h-1 w-1 rounded-full bg-ref-sun/80 shadow-[0_0_8px_rgba(252,164,124,0.65)]"
              style={{ left: twinkle.left, top: twinkle.top }}
              aria-hidden
              data-tt-traveltrust-hero-stars-twinkle-l5="1"
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.15, 0.85] }}
              transition={{
                duration: twinkle.duration,
                delay: twinkle.delay,
                repeat: TT_HERO_REDUCE_MOTION_STARS_L5.twinkleRepeat,
                ease: "easeInOut",
              }}
            />
          ))
        : null}
    </motion.div>
  );
}
