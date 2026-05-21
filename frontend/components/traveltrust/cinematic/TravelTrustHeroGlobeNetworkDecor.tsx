"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import {
  TRAVELTRUST_HERO_P3_CORRIDOR_ROUTE_COUNT,
  TRAVELTRUST_HERO_P3_CORRIDOR_ROUTES,
  isHeroP3CorridorRouteHighlighted,
} from "@/lib/traveltrustHeroP3CorridorPaths";
import {
  TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT,
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  isHeroP3DecorNodeHighlighted,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveTraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import { projectHeroP3DecorNodes } from "@/lib/traveltrustHeroP3ScreenProjection";
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrustCinematicNonGlobeL5";

const VIEWBOX = "0 0 100 56";

export function TravelTrustHeroGlobeNetworkDecor() {
  const reduceMotion = useReducedMotion();
  const { focusedRegionId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const activeCorridorId = resolveTraveltrustStartCorridorId(focusedRegionId, routeBias);
  const hasFocus = Boolean(focusedRegionId);
  const projectedNodes = useMemo(() => projectHeroP3DecorNodes(TRAVELTRUST_HERO_P3_DECOR_NODES), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible opacity-[0.72]"
      aria-hidden
      data-tt-traveltrust-hero-p3-layer="1"
      data-tt-traveltrust-hero-p3-node-count={String(TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT)}
      data-tt-traveltrust-hero-p3-corridor-count={String(TRAVELTRUST_HERO_P3_CORRIDOR_ROUTE_COUNT)}
      data-tt-traveltrust-hero-p3-corridor-active={activeCorridorId}
      data-tt-traveltrust-hero-p3-visual-weight="light"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-55"
        viewBox={VIEWBOX}
        preserveAspectRatio="xMidYMid meet"
        data-tt-traveltrust-hero-p3-svg="1"
      >
        <defs>
          <linearGradient id="tt-hero-p3-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(252,164,124,0.04)" />
            <stop offset="50%" stopColor="rgba(252,164,124,0.28)" />
            <stop offset="100%" stopColor="rgba(252,164,124,0.06)" />
          </linearGradient>
        </defs>
        {TRAVELTRUST_HERO_P3_CORRIDOR_ROUTES.map((route) => {
          const active = isHeroP3CorridorRouteHighlighted(route, activeCorridorId, hasFocus);
          return (
            <g key={route.id} data-tt-traveltrust-hero-p3-corridor={route.id}>
              <motion.path
                d={route.pathD}
                fill="none"
                stroke="url(#tt-hero-p3-arc-grad)"
                strokeWidth={active ? 0.9 : 0.55}
                strokeLinecap="round"
                strokeOpacity={active ? 0.52 : 0.2}
                strokeDasharray={reduceMotion ? undefined : "3 8"}
                animate={reduceMotion ? undefined : { strokeDashoffset: [0, -22] }}
                transition={
                  reduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: "linear" }
                }
              />
              {!reduceMotion && active ? (
                <circle r={0.65} fill="rgba(252,164,124,0.7)" data-tt-traveltrust-hero-p3-pulse="1">
                  <animateMotion
                    dur={`${4.2 + route.id.length * 0.04}s`}
                    repeatCount="indefinite"
                    path={route.pathD}
                  />
                </circle>
              ) : null}
            </g>
          );
        })}
      </svg>
      {projectedNodes.map((node) => {
        const active = isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId);
        const r = node.tier === "S" ? 2.8 : node.tier === "A" ? 2.2 : 1.8;
        return (
          <motion.span
            key={node.id}
            className="absolute rounded-full"
            style={{
              left: `${node.leftPct}%`,
              top: `${node.topPct}%`,
              width: r * 2,
              height: r * 2,
              marginLeft: -r,
              marginTop: -r,
              background: active
                ? "radial-gradient(circle, rgba(252,164,124,0.75) 0%, rgba(252,164,124,0.22) 55%, transparent 72%)"
                : "radial-gradient(circle, rgba(252,164,124,0.35) 0%, rgba(252,164,124,0.08) 50%, transparent 70%)",
              boxShadow: active ? "0 0 8px rgba(252,164,124,0.35)" : "none",
            }}
            data-tt-traveltrust-hero-p3-node="1"
            data-tt-traveltrust-hero-p3-node-id={node.id}
            data-tt-traveltrust-hero-p3-node-tier={node.tier}
            animate={
              reduceMotion || !active
                ? undefined
                : {
                    scale: [1, 1.12, 1],
                    opacity: [0.7, 0.95, 0.7],
                  }
            }
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}
    </div>
  );
}
