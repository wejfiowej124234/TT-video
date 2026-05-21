"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import {
  TRAVELTRUST_START_L5_STEP_IDS,
  type TraveltrustStartL5StepId,
} from "@/lib/traveltrustStartStepIds";
import {
  buildHeroP3StartStepHref,
  resolveHeroP3NarrativeContext,
} from "@/lib/traveltrustHeroP3Narrative";
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrustCinematicNonGlobeL5";

export function TravelTrustHeroNetworkNarrative() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { startPrefillRegionId, startPrefillStepId } = useHeroGlobeP1Link();
  const { routeBias } = useTraveltrustGlobeHeroHud();
  const ctx = useMemo(
    () =>
      resolveHeroP3NarrativeContext(
        startPrefillRegionId,
        routeBias,
        startPrefillStepId ?? "plan",
      ),
    [startPrefillRegionId, startPrefillStepId, routeBias],
  );

  return (
    <motion.div
      className="mt-1.5 space-y-2"
      data-tt-traveltrust-hero-p3-narrative="1"
      data-tt-traveltrust-hero-l5-narrative="1"
      data-tt-traveltrust-hero-p3-corridor={ctx.corridorId}
      data-tt-traveltrust-hero-p3-step-id={ctx.stepId}
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <p
        className="max-w-md text-meta font-medium leading-snug text-ref-sun/90"
        data-tt-traveltrust-hero-p3-lead="1"
      >
        {t("traveltrust_hero_p3_lead")}
      </p>

      <div
        className="flex flex-wrap items-center gap-1"
        role="group"
        aria-label={t("traveltrust_hero_p3_escrow_timeline_aria")}
        data-tt-traveltrust-hero-p3-escrow-timeline="1"
      >
        {TRAVELTRUST_START_L5_STEP_IDS.map((stepId, index) => {
          const active = ctx.stepId === stepId;
          const href = buildHeroP3StartStepHref(ctx.regionId, stepId as TraveltrustStartL5StepId);
          return (
            <Link
              key={stepId}
              href={href}
              className={`rounded border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                active
                  ? "border-ref-sun/40 bg-ref-sun/10 text-ref-sun"
                  : "border-ref-sun/14 bg-ink-950/45 text-slate-400/85 hover:border-ref-sun/26 hover:text-ref-sun/85"
              }`}
              data-tt-traveltrust-hero-p3-timeline-step={stepId}
              aria-current={active ? "step" : undefined}
            >
              <span className="mr-0.5 tabular-nums text-ref-sun/65">{index + 1}</span>
              {t(`traveltrust_hero_p3_timeline_${stepId}` as "traveltrust_hero_p3_timeline_plan")}
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
