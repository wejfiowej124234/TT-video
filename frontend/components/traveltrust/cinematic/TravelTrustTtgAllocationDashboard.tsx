"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
  TT_L5_MOTION_EASE,
  TT_TTG_ALLOCATION_L5,
} from "@/lib/traveltrust/l5";

const R = TT_TTG_ALLOCATION_L5.radius;
const INNER_R = TT_TTG_ALLOCATION_L5.innerRadius;
const C = 2 * Math.PI * R;
const GAP = C * TT_TTG_ALLOCATION_L5.gapRatio;
const USABLE = C - GAP * 5;
const TICK_COUNT = 48;

const ARCS = [
  { id: "public", pct: 0.5, stroke: TT_TTG_ALLOCATION_L5.publicStroke },
  { id: "dao", pct: 0.35, stroke: TT_TTG_ALLOCATION_L5.daoStroke },
  { id: "team", pct: 0.03, stroke: TT_TTG_ALLOCATION_L5.teamStroke },
  { id: "marketing", pct: 0.05, stroke: TT_TTG_ALLOCATION_L5.marketingStroke },
  { id: "treasury", pct: 0.07, stroke: TT_TTG_ALLOCATION_L5.treasuryStroke },
] as const;

function polar(cx: number, angle: number, radius: number) {
  return { x: cx + Math.cos(angle) * radius, y: cx + Math.sin(angle) * radius };
}

function arcGeometry(cx: number) {
  let cursor = 0;
  let calloutIndex = 0;
  return ARCS.map((arc) => {
    const length = USABLE * arc.pct;
    const offset = cursor;
    cursor += length + GAP;
    const midRatio = (offset + length / 2) / C;
    const midAngle = midRatio * Math.PI * 2 - Math.PI / 2;
    const callout = arc.pct < 0.1;
    const labelRadius = callout
      ? TT_TTG_ALLOCATION_L5.labelCalloutRadius + calloutIndex++ * 12
      : TT_TTG_ALLOCATION_L5.labelOnArcRadius;
    return {
      ...arc,
      length,
      offset,
      midAngle,
      callout,
      pctLabel: `${Math.round(arc.pct * 100)}%`,
      label: polar(cx, midAngle, labelRadius),
      strokePoint: polar(cx, midAngle, R + TT_TTG_ALLOCATION_L5.strokeWidth / 2),
    };
  });
}

const LEGEND = [
  {
    id: "public",
    pct: 0.5,
    titleKey: "traveltrust_trust_fact_protocol_title",
    summaryKey: "traveltrust_trust_fact_protocol_summary",
    event: "public_allocation",
    swatch: TT_TTG_ALLOCATION_L5.publicStroke,
    burnable: true,
  },
  {
    id: "dao",
    pct: 0.35,
    titleKey: "traveltrust_trust_fact_governance_title",
    summaryKey: "traveltrust_trust_fact_governance_summary",
    event: "dao_allocation",
    swatch: TT_TTG_ALLOCATION_L5.daoStroke,
    burnable: false,
  },
  {
    id: "team",
    pct: 0.03,
    titleKey: "traveltrust_trust_fact_escrow_title",
    summaryKey: "traveltrust_trust_fact_escrow_summary",
    event: "team_allocation",
    swatch: TT_TTG_ALLOCATION_L5.teamStroke,
    burnable: false,
  },
  {
    id: "marketing",
    pct: 0.05,
    titleKey: "traveltrust_ttg_alloc_marketing_title",
    summaryKey: "traveltrust_ttg_alloc_marketing_summary",
    event: "marketing_allocation",
    swatch: TT_TTG_ALLOCATION_L5.marketingStroke,
    burnable: false,
  },
  {
    id: "treasury",
    pct: 0.07,
    titleKey: "traveltrust_ttg_alloc_treasury_title",
    summaryKey: "traveltrust_ttg_alloc_treasury_summary",
    event: "treasury_allocation",
    swatch: TT_TTG_ALLOCATION_L5.treasuryStroke,
    burnable: false,
  },
] as const;

const PURPOSE_KEYS = [
  "traveltrust_ttg_alloc_purpose_burn",
  "traveltrust_ttg_alloc_purpose_eco",
] as const;

export function TravelTrustTtgAllocationDashboard() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [hoverId, setHoverId] = useState<string | null>(null);
  const vb = TT_TTG_ALLOCATION_L5.viewBox;
  const cx = vb / 2;
  const arcs = useMemo(() => arcGeometry(cx), [cx]);
  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
        const inner = INNER_R - 6;
        const outer = INNER_R - 1;
        return {
          x1: cx + Math.cos(angle) * inner,
          y1: cx + Math.sin(angle) * inner,
          x2: cx + Math.cos(angle) * outer,
          y2: cx + Math.sin(angle) * outer,
        };
      }),
    [cx],
  );

  return (
    <div
      className={TT_TTG_ALLOCATION_L5.plateClass}
      data-tt-traveltrust-ttg-alloc="1"
      data-tt-traveltrust-trust-warm-plate-l5="1"
      data-tt-traveltrust-ttg-alloc-ring-l5="v3"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      <div className={TT_TTG_ALLOCATION_L5.ringWrapClass} data-tt-traveltrust-ttg-alloc-ring="1">
        <div className={TT_TTG_ALLOCATION_L5.ringHaloClass} aria-hidden />
        <svg
          viewBox={`0 0 ${vb} ${vb}`}
          className="relative h-full w-full"
          role="img"
          aria-labelledby="tt-ttg-alloc-title tt-ttg-alloc-desc"
        >
          <title id="tt-ttg-alloc-title">{t("traveltrust_trust_strip_heading")}</title>
          <desc id="tt-ttg-alloc-desc">{t("traveltrust_ttg_alloc_ring_desc")}</desc>
          <defs>
            <radialGradient id="tt-alloc-core" cx="42%" cy="36%" r="68%">
              <stop offset="0%" stopColor="#2a2218" />
              <stop offset="55%" stopColor="#120f0c" />
              <stop offset="100%" stopColor="#070605" />
            </radialGradient>
            <linearGradient id="tt-alloc-sheen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="45%" stopColor="rgba(255,248,230,0.85)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="tt-alloc-glow" x="-24%" y="-24%" width="148%" height="148%">
              <feGaussianBlur stdDeviation="2.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={cx} cy={cx} r={INNER_R - 10} fill="url(#tt-alloc-core)" />
          <circle
            cx={cx}
            cy={cx}
            r={INNER_R - 10}
            fill="none"
            stroke="rgba(244,211,154,0.22)"
            strokeWidth="1.25"
          />
          <g opacity="0.55" aria-hidden>
            {ticks.map((tick, i) => (
              <line
                key={i}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="rgba(244,211,154,0.28)"
                strokeWidth={i % 8 === 0 ? 1.4 : 0.7}
              />
            ))}
          </g>
          <circle
            cx={cx}
            cy={cx}
            r={INNER_R}
            fill="none"
            stroke={TT_TTG_ALLOCATION_L5.innerTrackStroke}
            strokeWidth={TT_TTG_ALLOCATION_L5.innerStrokeWidth}
          />
          <circle
            cx={cx}
            cy={cx}
            r={R}
            fill="none"
            stroke={TT_TTG_ALLOCATION_L5.trackStroke}
            strokeWidth={TT_TTG_ALLOCATION_L5.strokeWidth}
          />
          {arcs.map((arc, i) => {
            const dimmed = hoverId !== null && hoverId !== arc.id;
            const active = hoverId === arc.id;
            return (
              <motion.circle
                key={arc.id}
                cx={cx}
                cy={cx}
                r={R}
                fill="none"
                stroke={arc.stroke}
                strokeWidth={active ? TT_TTG_ALLOCATION_L5.strokeWidth + 4 : TT_TTG_ALLOCATION_L5.strokeWidth}
                strokeLinecap="butt"
                pointerEvents="stroke"
                filter="url(#tt-alloc-glow)"
                transform={`rotate(-90 ${cx} ${cx})`}
                strokeDasharray={`${arc.length} ${C}`}
                data-tt-traveltrust-ttg-alloc-arc={arc.id}
                opacity={dimmed ? TT_TTG_ALLOCATION_L5.dimOpacity : 1}
                strokeDashoffset={reduceMotion ? -arc.offset : undefined}
                initial={reduceMotion ? false : { strokeDashoffset: C }}
                whileInView={reduceMotion ? undefined : { strokeDashoffset: -arc.offset }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{
                  duration: TT_TTG_ALLOCATION_L5.drawDuration,
                  delay: i * TT_TTG_ALLOCATION_L5.stagger,
                  ease: TT_L5_MOTION_EASE,
                }}
                onMouseEnter={() => setHoverId(arc.id)}
                onMouseLeave={() => setHoverId(null)}
              />
            );
          })}
          {arcs.map((arc) => {
            const dimmed = hoverId !== null && hoverId !== arc.id;
            return (
              <g
                key={`${arc.id}-label`}
                opacity={dimmed ? 0.35 : 1}
                data-tt-traveltrust-ttg-alloc-label={arc.id}
                onMouseEnter={() => setHoverId(arc.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                {arc.callout ? (
                  <line
                    x1={arc.strokePoint.x}
                    y1={arc.strokePoint.y}
                    x2={arc.label.x}
                    y2={arc.label.y}
                    stroke={arc.stroke}
                    strokeWidth="1.15"
                    opacity="0.85"
                  />
                ) : null}
                <text
                  x={arc.label.x}
                  y={arc.label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={TT_TTG_ALLOCATION_L5.labelClass}
                  fill={arc.callout ? "#F4D39A" : "#120f0c"}
                  stroke={arc.callout ? "rgba(12,10,9,0.88)" : "rgba(255,244,214,0.55)"}
                  strokeWidth={arc.callout ? 3.6 : 2.8}
                  paintOrder="stroke"
                  fontSize={11}
                  fontWeight={700}
                >
                  {arc.pctLabel}
                </text>
              </g>
            );
          })}
          {reduceMotion ? null : (
            <motion.g
              animate={{ rotate: 360 }}
              transition={{
                duration: TT_TTG_ALLOCATION_L5.sheenDuration,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: `${cx}px ${cx}px` }}
              data-tt-traveltrust-ttg-alloc-sheen="1"
            >
              <circle
                cx={cx}
                cy={cx}
                r={R}
                fill="none"
                stroke="url(#tt-alloc-sheen)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="22 560"
                transform={`rotate(-90 ${cx} ${cx})`}
              />
            </motion.g>
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className={TT_TTG_ALLOCATION_L5.centerValueClass} data-tt-traveltrust-ttg-alloc-center="1">
            {t("traveltrust_ttg_alloc_center")}
          </span>
          <span className={TT_TTG_ALLOCATION_L5.centerCaptionClass}>
            {t("traveltrust_ttg_alloc_center_caption")}
          </span>
        </div>
      </div>

      <ul className={TT_TTG_ALLOCATION_L5.legendListClass} data-tt-traveltrust-ttg-alloc-legend="1">
        {LEGEND.map((row, index) => (
          <motion.li
            key={row.id}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{
              duration: 0.36,
              delay: reduceMotion ? 0 : 0.18 + index * TT_TTG_ALLOCATION_L5.stagger,
              ease: TT_L5_MOTION_EASE,
            }}
            className={`${TT_TTG_ALLOCATION_L5.legendRowClass} cursor-default ${
              hoverId === row.id ? TT_TTG_ALLOCATION_L5.legendRowActiveClass : ""
            }`}
            onMouseEnter={() => setHoverId(row.id)}
            onMouseLeave={() => setHoverId(null)}
            data-tt-traveltrust-trust-fact-l5="1"
            data-tt-traveltrust-trust-fact-card={row.event}
            data-tt-traveltrust-ttg-alloc-burnable={row.burnable ? "1" : "0"}
          >
            <span
              className={TT_TTG_ALLOCATION_L5.legendSwatchClass}
              style={{ backgroundColor: row.swatch, color: row.swatch }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className={TT_TTG_ALLOCATION_L5.legendTitleClass}>
                {t(row.titleKey)}
                {row.burnable ? (
                  <span className={TT_TTG_ALLOCATION_L5.burnBadgeClass}>
                    {t("traveltrust_ttg_alloc_burnable_badge")}
                  </span>
                ) : null}
              </span>
              <span className={`block ${TT_TTG_ALLOCATION_L5.legendSummaryClass}`}>
                {t(row.summaryKey)}
              </span>
            </span>
            <span className={TT_TTG_ALLOCATION_L5.legendPctClass} aria-hidden>
              {Math.round(row.pct * 100)}%
            </span>
          </motion.li>
        ))}
      </ul>

      <ul
        className={`${TT_TTG_ALLOCATION_L5.purposeListClass} lg:col-span-2`}
        data-tt-traveltrust-ttg-alloc-purpose="1"
      >
        {PURPOSE_KEYS.map((key) => (
          <li key={key} className={TT_TTG_ALLOCATION_L5.purposeRowClass}>
            {t(key)}
          </li>
        ))}
      </ul>
    </div>
  );
}
