"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import { useHeroP3GlobeBoundProjection } from "@/lib/traveltrustHeroP3GlobeBoundProjection";
import {
  TRAVELTRUST_HERO_P3_CORRIDOR_ROUTE_COUNT,
  TRAVELTRUST_HERO_P3_CORRIDOR_ROUTES,
  isHeroP3CorridorRouteHighlighted,
} from "@/lib/traveltrustHeroP3CorridorPaths";
import {
  TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT,
  TRAVELTRUST_HERO_P3_DECOR_NODES,
  isHeroP3CoreLabelNode,
  isHeroP3DecorNodeHighlighted,
} from "@/lib/traveltrustHeroP3DecorNodes";
import { resolveTraveltrustStartCorridorId } from "@/lib/traveltrustStartCorridorBinding";
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  TRAVELTRUST_HERO_GLOBE_DOM_CORE_HUBS_ONLY,
  TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_PULSE_ENABLED,
  TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_SVG_ENABLED,
  TRAVELTRUST_HERO_GLOBE_DOM_HUB_DOTS_ENABLED,
  TRAVELTRUST_HERO_GLOBE_DOM_HUB_STATIC,
} from "@/lib/traveltrustGlobeHeroTuning";

const VIEWBOX = "0 0 100 56";

export function TravelTrustHeroGlobeNetworkDecor() {
  const reduceMotion = useReducedMotion();
  const { focusedRegionId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const activeCorridorId = resolveTraveltrustStartCorridorId(focusedRegionId, routeBias);
  const hasFocus = Boolean(focusedRegionId);
  const { nodes: projectedNodes, projectionActive } = useHeroP3GlobeBoundProjection(TRAVELTRUST_HERO_P3_DECOR_NODES);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-visible opacity-[0.88]"
      aria-hidden
      data-tt-traveltrust-hero-p3-layer="1"
      data-tt-traveltrust-hero-p3-node-count={String(TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT)}
      data-tt-traveltrust-hero-p3-corridor-count={String(TRAVELTRUST_HERO_P3_CORRIDOR_ROUTE_COUNT)}
      data-tt-traveltrust-hero-p3-corridor-active={activeCorridorId}
      data-tt-traveltrust-hero-p3-visual-weight="light"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      {TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_SVG_ENABLED ? (
      <svg
        className="absolute inset-0 h-full w-full opacity-72"
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
                strokeWidth={active ? 1.05 : 0.72}
                strokeLinecap="round"
                strokeOpacity={active ? 0.62 : 0.32}
                strokeDasharray={reduceMotion ? undefined : "3 8"}
                animate={reduceMotion ? undefined : { strokeDashoffset: [0, -22] }}
                transition={
                  reduceMotion ? undefined : { duration: 6.5, repeat: Infinity, ease: "linear" }
                }
              />
              {TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_PULSE_ENABLED && !reduceMotion && active ? (
                <circle r={0.75} fill="rgba(252,164,124,0.75)" data-tt-traveltrust-hero-p3-pulse="1">
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
      ) : null}
      {TRAVELTRUST_HERO_GLOBE_DOM_HUB_DOTS_ENABLED
        ? projectedNodes.map((node) => {
        if (!projectionActive || node.projectionMode !== "globe-bound") return null;
        if (node.globeBound && !node.globeBound.visible) return null;
        if (TRAVELTRUST_HERO_GLOBE_DOM_CORE_HUBS_ONLY && !isHeroP3CoreLabelNode(node.id)) return null;
        const active = isHeroP3DecorNodeHighlighted(node, focusedRegionId, activeCorridorId);
        const isCoreHub = isHeroP3CoreLabelNode(node.id);
        const r = node.tier === "S" ? 2.8 : node.tier === "A" ? 2.2 : 1.8;
        const limbFade = node.globeBound?.edgeFade ?? 1;
        const baseOpacity = (active ? 0.88 : isCoreHub ? 0.62 : 0.38) * limbFade;
        const breathe =
          !TRAVELTRUST_HERO_GLOBE_DOM_HUB_STATIC &&
          !reduceMotion &&
          isCoreHub
            ? {
                scale: active ? [1, 1.1, 1] : [1, 1.05, 1],
                opacity: active ? [0.78, 0.95, 0.78] : [baseOpacity * 0.85, baseOpacity, baseOpacity * 0.85],
              }
            : undefined;
        return (
          <motion.span
            key={node.id}
            className="absolute rounded-full"
            style={{
              left: `${node.leftPct}%`,
              top: `${node.topPct}%`,
              opacity: breathe ? undefined : baseOpacity,
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
            animate={breathe}
            transition={
              breathe
                ? {
                    duration: active ? 2.6 : 4.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : undefined
            }
          />
        );
      })
        : null}
    </div>
  );
}
