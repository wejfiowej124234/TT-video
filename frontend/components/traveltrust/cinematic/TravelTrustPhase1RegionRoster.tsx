"use client";

import Link from "next/link";
import { TT_TRAVELTRUST_SECTION_A11Y } from "./traveltrustSectionA11yIds";
import { useTranslation } from "@/components/LocaleProvider";
import { trackTravelTrustEvent } from "@/lib/analytics";
import {
  TRAVELTRUST_PHASE1_GLOBE_REGIONS,
  type TravelTrustPhase1GlobeRegion,
} from "@/lib/traveltrustPhase1GlobeRegions";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { resolveHeroGlobeCompactRosterLabel } from "@/lib/traveltrustHeroGlobeRosterCopy";
import { traveltrustPhase1RegionNameKey } from "@/lib/traveltrustPhase1RegionKeys";
import { TRAVELTRUST_V6_IN_PAGE_PLAN_HREF } from "@/lib/traveltrustPlanTripHref";
import {
  buildTraveltrustPlanTripHrefWithRegion,
  getHeroGlobeP1FocusedRegion,
  setHeroGlobeP1FocusedRegion,
  setHeroGlobeP1StartPrefill,
} from "@/lib/traveltrustHeroGlobeP1Link";
import { TT_CORRIDOR_ROSTER_L5 } from "@/lib/traveltrust/l5";

const TIER_LABEL: Record<TravelTrustPhase1GlobeRegion["tier"], string> = {
  S: "traveltrust_phase1_tier_s",
  A: "traveltrust_phase1_tier_a",
  B: "traveltrust_phase1_tier_b",
};

const PLAN_TRIP_HREF = TRAVELTRUST_V6_IN_PAGE_PLAN_HREF;

function bindRegionFocusHandlers(regionId: string) {
  return {
    onMouseEnter: () => setHeroGlobeP1FocusedRegion(regionId),
    onMouseLeave: () => {
      if (getHeroGlobeP1FocusedRegion() === regionId) setHeroGlobeP1FocusedRegion(null);
    },
    onFocus: () => setHeroGlobeP1FocusedRegion(regionId),
    onBlur: () => {
      if (getHeroGlobeP1FocusedRegion() === regionId) setHeroGlobeP1FocusedRegion(null);
    },
  };
}

type Props = {
  /** 桌面首屏：单行链到 #start 规划行程（L5 · TT-PH1-157） */
  compactOnLg?: boolean;
};

export function TravelTrustPhase1RegionRoster({ compactOnLg = false }: Props) {
  const { t } = useTranslation();
  const { routeBias, visibleHubIds } = useTraveltrustGlobeHeroHud();
  const headingId = TT_TRAVELTRUST_SECTION_A11Y.regionRoster.heading;
  const hintId = TT_TRAVELTRUST_SECTION_A11Y.regionRoster.hint;
  const compactLabel = resolveHeroGlobeCompactRosterLabel(t, routeBias, visibleHubIds);

  if (compactOnLg) {
    return (
      <nav
        className="pointer-events-auto z-[11] hidden w-full max-w-[min(calc(100%-2rem),19rem)] shrink-0 lg:absolute lg:bottom-6 lg:left-6 lg:block lg:w-max lg:translate-x-0 xl:left-8"
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
          href={PLAN_TRIP_HREF}
          className={TT_CORRIDOR_ROSTER_L5.compactLinkClass}
          title={compactLabel}
          data-tt-traveltrust-phase1-roster-plan-cta="1"
          onMouseEnter={() => {
            const id = visibleHubIds[0];
            if (id) setHeroGlobeP1FocusedRegion(id);
          }}
          onMouseLeave={() => setHeroGlobeP1FocusedRegion(null)}
          onClick={() => {
            const id = visibleHubIds[0] ?? null;
            if (id) setHeroGlobeP1StartPrefill(id);
            trackTravelTrustEvent("traveltrust_plan_trip_click", {
              source: "phase1_roster_compact",
              target: PLAN_TRIP_HREF,
              region_id: id ?? undefined,
            });
          }}
        >
          <span className="line-clamp-2 text-balance">{compactLabel}</span>
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
        {(visibleHubIds.length > 0
          ? TRAVELTRUST_PHASE1_GLOBE_REGIONS.filter((r) => visibleHubIds.includes(r.id))
          : TRAVELTRUST_PHASE1_GLOBE_REGIONS
        ).map((region) => {
          const name = t(traveltrustPhase1RegionNameKey(region.id));
          return (
            <li key={region.id}>
              <Link
                href={buildTraveltrustPlanTripHrefWithRegion(PLAN_TRIP_HREF, region.id)}
                className={TT_CORRIDOR_ROSTER_L5.chipLinkClass}
                title={name}
                data-tt-traveltrust-phase1-region={region.id}
                data-tt-traveltrust-phase1-region-tier={region.tier}
                {...bindRegionFocusHandlers(region.id)}
                onClick={() => {
                  setHeroGlobeP1StartPrefill(region.id);
                  trackTravelTrustEvent("traveltrust_plan_trip_click", {
                    source: "phase1_roster",
                    target: buildTraveltrustPlanTripHrefWithRegion(PLAN_TRIP_HREF, region.id),
                    role: region.id,
                    region_id: region.id,
                  });
                }}
              >
                <span className="truncate">{name}</span>
                <span
                  className="shrink-0 rounded px-1 py-px font-mono text-[9px] uppercase tracking-wide text-ref-sun/85"
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
