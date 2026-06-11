"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TT_BELOW_FOLD_PLACEHOLDER_L5 } from "@/lib/traveltrust/l5";

export function BelowFoldSectionPlaceholder({ tall = false }: { tall?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={`${TT_BELOW_FOLD_PLACEHOLDER_L5.pulseClass} ${
        tall ? "min-h-[min(52vh,480px)]" : "min-h-[12rem]"
      }`}
      aria-hidden
      data-tt-traveltrust-below-fold-placeholder="1"
      data-tt-traveltrust-below-fold-placeholder-l5="1"
      data-tt-traveltrust-below-fold-placeholder-tall={tall ? "1" : "0"}
      animate={reduceMotion ? undefined : { opacity: [0.35, 0.55, 0.35] }}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.pulseDuration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.pulseRepeat,
              ease: "easeInOut",
            }
      }
    >
      {!reduceMotion ? (
        <>
          <motion.div
            className={TT_BELOW_FOLD_PLACEHOLDER_L5.warmCoreClass}
            aria-hidden
            data-tt-traveltrust-below-fold-placeholder-warm-core-l5="1"
            animate={{ opacity: [...TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulse.opacity] }}
            transition={{
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulse.duration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.warmCorePulseRepeat,
              ease: "easeInOut",
            }}
          />
          <motion.span
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/45 to-transparent"
            aria-hidden
            animate={{ x: ["-30%", "130%"] }}
            transition={{
              duration: TT_BELOW_FOLD_PLACEHOLDER_L5.shimmerDuration,
              repeat: TT_BELOW_FOLD_PLACEHOLDER_L5.shimmerRepeat,
              ease: "easeInOut",
            }}
          />
        </>
      ) : null}
    </motion.div>
  );
}
