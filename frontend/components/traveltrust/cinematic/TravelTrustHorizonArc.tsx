"use client";



import { motion, useReducedMotion } from "framer-motion";

import { TT_HORIZON_ARC_L5, TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrust/l5";



/** Hero 底缘暖色地平线弧 + 示意旅行动点（L5 · ①） */

export function TravelTrustHorizonArc() {

  const reduceMotion = useReducedMotion();

  const h = TT_HORIZON_ARC_L5;



  return (

    <motion.div

      className="relative -mt-1 h-16 w-full overflow-hidden sm:h-20"

      aria-hidden

      data-tt-traveltrust-horizon-arc-l5="1"

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

      initial={reduceMotion ? false : { opacity: 0 }}

      animate={{ opacity: 1 }}

      transition={{ duration: h.entranceDuration, ease: h.entranceEase }}

    >

      {!reduceMotion ? (
        <motion.span
          className="pointer-events-none absolute inset-x-[8%] top-2 h-px bg-gradient-to-r from-transparent via-ref-sun/55 to-transparent"
          aria-hidden
          data-tt-traveltrust-horizon-ambient-shimmer-l5="1"
          animate={{ opacity: [...h.ambientShimmerOpacity], x: ["-8%", "8%", "-8%"] }}
          transition={{
            opacity: { duration: h.ambientShimmerDuration, repeat: h.ambientShimmerRepeat, ease: "easeInOut" },
            x: { duration: h.ambientShimmerDuration * 1.35, repeat: h.ambientShimmerRepeat, ease: "easeInOut" },
          }}
        />
      ) : null}

      <svg className="absolute bottom-0 left-0 h-full w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">

        <defs>

          <linearGradient id="tt-horizon-grad" x1="0%" y1="0%" x2="100%" y2="0%">

            <stop offset="0%" stopColor={h.gradStop0} stopOpacity="0.88" />

            <stop offset="50%" stopColor={h.gradStop50} stopOpacity="0.92" />

            <stop offset="100%" stopColor={h.gradStop100} stopOpacity="0.82" />

          </linearGradient>

          <linearGradient id="tt-horizon-fill-grad" x1="0%" y1="0%" x2="0%" y2="100%">

            <stop offset="0%" stopColor={h.fillBase} stopOpacity={String(h.fillTopOpacity)} />

            <stop offset="42%" stopColor={h.fillBase} stopOpacity={String(h.fillMidOpacity)} />

            <stop offset="100%" stopColor={h.fillBase} stopOpacity={String(h.fillBottomOpacity)} />

          </linearGradient>

          <filter id="tt-horizon-glow">

            <feGaussianBlur stdDeviation="3" result="blur" />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

        </defs>

        <path

          d="M0 72 Q360 8 720 40 T1440 56 L1440 80 L0 80 Z"

          fill="url(#tt-horizon-fill-grad)"

        />

        <motion.path

          d="M0 72 Q360 8 720 40 T1440 56"

          fill="none"

          stroke="url(#tt-horizon-grad)"

          strokeWidth={h.glowStrokeWidth}

          filter="url(#tt-horizon-glow)"

          initial={reduceMotion ? false : { opacity: h.strokeOpacityRange[0] }}

          animate={

            reduceMotion

              ? { opacity: 0.9 }

              : { opacity: [h.strokeOpacityRange[0], h.strokeOpacityRange[1], h.strokeOpacityRange[0]] }

          }

          transition={{

            duration: h.strokePulseDuration,

            repeat: h.strokePulseRepeat,

            ease: "easeInOut",

          }}

        />

        <motion.path

          d="M0 72 Q360 8 720 40 T1440 56"

          fill="none"

          stroke="url(#tt-horizon-grad)"

          strokeWidth="1.5"

          initial={reduceMotion ? false : { opacity: 0.75 }}

          animate={

            reduceMotion

              ? { opacity: 0.85 }

              : { opacity: [0.7, 0.95, 0.7] }

          }

          transition={{

            duration: h.strokePulseDuration * 1.15,

            repeat: h.strokePulseRepeat,

            ease: "easeInOut",

          }}

        />

      </svg>

      {!reduceMotion ? (
        <motion.div
          className={h.groundGlowClass}
          aria-hidden
          data-tt-traveltrust-horizon-ground-glow-l5="1"
          animate={{ opacity: [...h.groundGlowPulse.opacity] }}
          transition={{
            duration: h.groundGlowPulse.duration,
            repeat: h.groundGlowRepeat,
            ease: "easeInOut",
          }}
        />
      ) : null}

      {!reduceMotion

        ? h.travelers.map((t, i) => (

            <motion.div

              key={i}

              className="absolute h-1.5 w-1.5 rounded-full bg-ref-sun/90 shadow-[0_0_10px_var(--tt-horizon-traveler-glow)]"

              style={{

                left: t.left,

                bottom: t.bottom,

                ["--tt-horizon-traveler-glow" as string]: h.travelerGlow,

              }}

              animate={{

                x: [0, 120, 240, 120, 0],

                opacity: [0.35, 1, 0.55, 0.95, 0.35],

              }}

              transition={{

                duration: t.duration,

                delay: t.delay,

                repeat: Infinity,

                ease: "easeInOut",

              }}

            />

          ))

        : null}

    </motion.div>

  );

}


