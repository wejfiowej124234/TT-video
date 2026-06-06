"use client";



import { motion, useReducedMotion } from "framer-motion";

import { useTranslation } from "@/components/LocaleProvider";

import {

  TT_L5_MOTION_EASE,

  TT_ROUTE_ARC_L5,
  TT_ROUTE_ARC_THEATER_LABELS_L5,

  TT_WARM_ROUTE_ARC_SVG,

  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,

} from "@/lib/traveltrust/l5";



const ROUTE_PATHS = [

  "M-20 280 C 120 120, 280 320, 420 180 S 680 80, 820 220",

  "M-40 320 C 80 200, 200 360, 360 240 S 620 160, 860 280",

  "M0 200 C 160 80, 320 280, 500 140 S 720 40, 840 180",

] as const;

const DEFAULT_LABELS = [

  { labelX: 52, labelY: 38, labelW: 118, labelH: 22 },

  { labelX: 58, labelY: 52, labelW: 108, labelH: 22 },

  { labelX: 62, labelY: 28, labelW: 96, labelH: 22 },

] as const;

type Props = {
  variant?: "default" | "theater";
};

/** 身份剧场背景：慢速示意走廊 + 标签（L5 P0-2 · 非数据真值） */

export function TravelTrustRouteArc({ variant = "default" }: Props) {

  const { t } = useTranslation();

  const reduceMotion = useReducedMotion();

  const labelLayout = variant === "theater" ? TT_ROUTE_ARC_THEATER_LABELS_L5 : DEFAULT_LABELS;
  const isTheater = variant === "theater";
  const containerOpacity = isTheater ? TT_ROUTE_ARC_L5.theaterContainerOpacity : TT_ROUTE_ARC_L5.containerOpacity;
  const glowPeak = isTheater ? TT_ROUTE_ARC_L5.theaterGlowOpacityPeak : TT_ROUTE_ARC_L5.glowOpacityPeak;
  const flowDotDuration = isTheater ? TT_ROUTE_ARC_L5.theaterFlowDotDuration : TT_ROUTE_ARC_L5.flowDotDuration;

  const routes = ROUTE_PATHS.map((d, i) => ({ d, ...labelLayout[i] }));

  if (reduceMotion) return null;



  return (

    <motion.div

      className={`pointer-events-none absolute z-0 overflow-hidden ${isTheater ? TT_ROUTE_ARC_L5.theaterArcInsetClass : "top-8 bottom-0 -inset-x-8"}`}

      style={{ opacity: containerOpacity }}
      data-tt-traveltrust-route-arc-theater-boost-l5={isTheater ? "1" : "0"}

      aria-hidden

      data-tt-traveltrust-theater-route-arc-l5="1"
      data-tt-traveltrust-route-arc-variant={variant}
      data-tt-traveltrust-theater-route-labels-edge-l5={variant === "theater" ? "1" : "0"}

      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}

      initial={{ opacity: 0 }}

      whileInView={{ opacity: 1 }}

      viewport={{ once: true, margin: "-10% 0px" }}

      transition={{ duration: TT_ROUTE_ARC_L5.entranceDuration }}

    >

      <svg className="h-full w-full" viewBox="0 0 800 400" preserveAspectRatio="none">

        <defs>

          <linearGradient id="tt-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">

            <stop offset="0%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop0} />

            <stop offset="35%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop35} />

            <stop offset="65%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop65} />

            <stop offset="100%" stopColor={TT_WARM_ROUTE_ARC_SVG.stop100} />

          </linearGradient>

          <filter id="tt-route-glow" x="-20%" y="-20%" width="140%" height="140%">

            <feGaussianBlur stdDeviation="2.5" result="blur" />

            <feMerge>

              <feMergeNode in="blur" />

              <feMergeNode in="SourceGraphic" />

            </feMerge>

          </filter>

        </defs>

        {routes.map((route, i) => (

          <g key={route.d} filter={i === 0 ? "url(#tt-route-glow)" : undefined}>

            <motion.path

              d={route.d}

              fill="none"

              stroke="url(#tt-route-grad)"

              strokeWidth={i === 0 ? 3.2 : 2}

              strokeLinecap="round"

              strokeDasharray={i === 0 ? undefined : "6 14"}

              initial={{ pathLength: 0, opacity: 0.12 }}

              animate={{

                pathLength: 1,

                opacity: [0.18, glowPeak, 0.18],

              }}

              transition={{

                pathLength: {

                  duration: TT_ROUTE_ARC_L5.pathDrawBaseDuration + i * TT_ROUTE_ARC_L5.pathDrawStagger,

                  ease: TT_L5_MOTION_EASE,

                },

                opacity: {

                  duration: TT_ROUTE_ARC_L5.opacityPulseBase + i * 2,

                  repeat: Infinity,

                  ease: "easeInOut",

                },

              }}

            />

            <motion.path

              d={route.d}

              fill="none"

              stroke="url(#tt-route-grad)"

              strokeWidth={i === 0 ? 1.35 : 0.95}

              strokeLinecap="round"

              strokeDasharray={i === 0 ? undefined : "6 14"}

              initial={{ pathLength: 0, opacity: 0.25 }}

              animate={{

                pathLength: 1,

                opacity: [0.35, TT_ROUTE_ARC_L5.pathOpacityPeak, 0.35],

                strokeDashoffset: i === 0 ? 0 : [0, -40, 0],

              }}

              transition={{

                pathLength: {

                  duration: TT_ROUTE_ARC_L5.pathDrawBaseDuration + i * TT_ROUTE_ARC_L5.pathDrawStagger,

                  ease: TT_L5_MOTION_EASE,

                },

                opacity: {

                  duration: TT_ROUTE_ARC_L5.opacityPulseBase + i * 2,

                  repeat: Infinity,

                  ease: "easeInOut",

                },

                strokeDashoffset: {

                  duration: TT_ROUTE_ARC_L5.dashOffsetBase + i * 3,

                  repeat: Infinity,

                  ease: "linear",

                },

              }}

            />

            {!isTheater ? (
              <foreignObject
                x={`${route.labelX - 8}%`}
                y={`${route.labelY - 2}%`}
                width={route.labelW}
                height={route.labelH}
              >
                <motion.div
                  className={TT_ROUTE_ARC_L5.labelPillClass}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: [0.55, 0.95, 0.55], y: 0 }}
                  transition={{
                    opacity: {
                      duration: TT_ROUTE_ARC_L5.labelPulseBase + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                    y: { duration: TT_ROUTE_ARC_L5.labelEntranceYDuration, ease: TT_L5_MOTION_EASE },
                  }}
                >
                  {t(TT_ROUTE_ARC_L5.labelKeys[i])}
                </motion.div>
              </foreignObject>
            ) : null}

          </g>

        ))}

      </svg>

      <motion.div

        className="absolute left-[18%] top-[42%] h-1.5 w-1.5 rounded-full bg-ref-sun shadow-[0_0_14px_rgba(252,164,124,0.75)]"

        animate={{ x: [0, 220, 420, 220, 0], y: [0, -40, 20, 60, 0] }}

        transition={{ duration: TT_ROUTE_ARC_L5.travelerDotDuration, repeat: Infinity, ease: "easeInOut" }}

      />

      <motion.div

        className="absolute left-[22%] top-[38%] h-1 w-1 rounded-full bg-amber-100/80 shadow-[0_0_8px_rgba(255,232,212,0.5)]"

        animate={{ x: [40, 180, 360, 180, 40], y: [10, -28, 8, 48, 10] }}

        transition={{ duration: flowDotDuration, repeat: Infinity, ease: "linear" }}

      />

      {isTheater ? (
        <motion.div
          className="absolute left-[28%] top-[48%] h-1.5 w-1.5 rounded-full bg-ref-coral/90 shadow-[0_0_12px_rgba(255,140,90,0.65)]"
          aria-hidden
          data-tt-traveltrust-route-arc-theater-flow-l5="1"
          animate={{ x: [80, 260, 440, 260, 80], y: [20, -18, 6, 32, 20] }}
          transition={{ duration: TT_ROUTE_ARC_L5.theaterFlowDotDuration * 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}

    </motion.div>

  );

}


