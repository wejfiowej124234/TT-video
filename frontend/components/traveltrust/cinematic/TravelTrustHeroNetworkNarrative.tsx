"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { useTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";
import { useHeroGlobeP1Link } from "@/lib/traveltrustHeroGlobeP1Link";
import { resolveHeroP3NarrativeContext } from "@/lib/traveltrustHeroP3Narrative";
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrust/l5";

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
      className="mt-2 space-y-3"
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
        className="max-w-md text-small font-medium leading-relaxed text-ref-sun/90"
        data-tt-traveltrust-hero-p3-lead="1"
      >
        {t("traveltrust_hero_p3_lead")}
      </p>
    </motion.div>
  );
}
