"use client";

import Link from "next/link";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  type TravelTrustPhase1GlobeRegion,
} from "@/lib/traveltrustPhase1GlobeRegions";
import { traveltrustPhase1RegionNameKey } from "@/lib/traveltrustPhase1RegionKeys";

const TIER_LABEL: Record<TravelTrustPhase1GlobeRegion["tier"], string> = {
  S: "traveltrust_phase1_tier_s",
  A: "traveltrust_phase1_tier_a",
  B: "traveltrust_phase1_tier_b",
};

const GOVERNANCE_PARAMS_HREF = "/governance/params";

type Props = {
  /** 桌面首屏：单行链到协议参数，避免 10 个 pill 抢视觉（截图 · TT-PH1-157） */
  compactOnLg?: boolean;
};

/** 可聚焦的第一阶段区域列表 — 替代 3D 节点假可点（TT-PH1-157 · ①） */
export function TravelTrustPhase1RegionRoster({ compactOnLg = false }: Props) {
  const { t } = useTranslation();
  const headingId = TT_TRAVELTRUST_SECTION_A11Y.regionRoster.heading;
  const hintId = TT_TRAVELTRUST_SECTION_A11Y.regionRoster.hint;

  if (compactOnLg) {
    return (
      <nav
        className="pointer-events-auto z-[2] hidden w-full max-w-[min(100%,18rem)] shrink-0 lg:absolute lg:bottom-5 lg:left-1 lg:block lg:self-auto"
        aria-labelledby={headingId}
        aria-describedby={hintId}
        data-tt-traveltrust-phase1-region-roster="1"
        data-tt-traveltrust-phase1-region-roster-compact="1"
      >
        <p id={headingId} className="sr-only">
          {t("traveltrust_phase1_roster_heading")}
        </p>
        <p id={hintId} className="sr-only">
          {t("traveltrust_phase1_roster_hint")}
        </p>
        <Link
          href={GOVERNANCE_PARAMS_HREF}
          className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-white/12 bg-ink-950/60 px-3 py-1.5 text-meta text-slate-300 transition hover:border-ref-cyan/35 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55"
          onClick={() =>
            trackTravelTrustEvent("traveltrust_secondary_cta_click", {
              source: "phase1_roster_compact",
              target: GOVERNANCE_PARAMS_HREF,
            })
          }
        >
          {t("traveltrust_phase1_roster_compact")}
        </Link>
      </nav>
    );
  }

  return (
    <nav
      className="pointer-events-auto mt-2 w-full max-w-md lg:hidden"
      aria-labelledby={headingId}
      aria-describedby={hintId}
      data-tt-traveltrust-phase1-region-roster="1"
      data-tt-traveltrust-phase1-region-roster-compact="0"
    >
      <p id={headingId} className="sr-only">
        {t("traveltrust_phase1_roster_heading")}
      </p>
      <p id={hintId} className="sr-only">
        {t("traveltrust_phase1_roster_hint")}
      </p>
      <ul className="flex flex-wrap justify-center gap-1.5">
        {TRAVELTRUST_PHASE1_GLOBE_REGIONS.map((region) => {
          const name = t(traveltrustPhase1RegionNameKey(region.id));
          return (
            <li key={region.id}>
              <Link
                href={GOVERNANCE_PARAMS_HREF}
                className="inline-flex max-w-[9.5rem] items-center gap-1 truncate rounded-full border border-white/12 bg-ink-950/55 px-2 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-sm transition hover:border-ref-cyan/35 hover:bg-ref-cyan/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/55 sm:max-w-[10.5rem] sm:px-2.5 sm:text-meta"
                title={name}
                data-tt-traveltrust-phase1-region={region.id}
                data-tt-traveltrust-phase1-region-tier={region.tier}
                onClick={() =>
                  trackTravelTrustEvent("traveltrust_secondary_cta_click", {
                    source: "phase1_roster",
                    target: GOVERNANCE_PARAMS_HREF,
                    role: region.id,
                  })
                }
              >
                <span className="truncate">{name}</span>
                <span
                  className="shrink-0 rounded px-1 py-px font-mono text-[9px] uppercase tracking-wide text-ref-cyan/90"
                  aria-label={t(TIER_LABEL[region.tier])}
                >
                  {region.tier}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
