"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getTraveltrustCinematicQualityPref,
  isTraveltrustCinematicLowQuality,
  setTraveltrustCinematicQualityPref,
} from "@/lib/traveltrustCinematicPerf";
import {
  TT_CINEMATIC_QUALITY_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

type Props = { /** 顶栏首屏：短标签，减横条占用（TT-PH1-155） */ compact?: boolean };

/** 显式低画质开关（TT-PH1-160 · ①） */
export function TravelTrustCinematicLowQualityToggle({ compact = false }: Props = {}) {
  const { t } = useTranslation();
  const [low, setLow] = useState(false);
  const [pref, setPref] = useState<"auto" | "on" | "off">("auto");

  useEffect(() => {
    setLow(isTraveltrustCinematicLowQuality());
    setPref(getTraveltrustCinematicQualityPref());
  }, []);

  const toggle = useCallback(() => {
    const nextPref = low ? "off" : "on";
    setTraveltrustCinematicQualityPref(nextPref);
    setPref(nextPref);
    setLow(!low);
    window.location.reload();
  }, [low]);

  const label =
    pref === "auto" && low
      ? t("traveltrust_cinematic_quality_low_auto")
      : low
        ? t("traveltrust_cinematic_quality_low_on")
        : t("traveltrust_cinematic_quality_low_off");
  const help = t("traveltrust_cinematic_quality_toggle_help");

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={TT_CINEMATIC_QUALITY_L5.hover}
      whileTap={TT_CINEMATIC_QUALITY_L5.tap}
      animate={low ? { boxShadow: [...TT_CINEMATIC_QUALITY_L5.activeBoxShadow] } : undefined}
      transition={{
        duration: TT_CINEMATIC_QUALITY_L5.activePulseDuration,
        repeat: TT_CINEMATIC_QUALITY_L5.activePulseRepeat,
        ease: "easeInOut",
      }}
      className={`${compact ? TT_CINEMATIC_QUALITY_L5.toggleCompactClass : TT_CINEMATIC_QUALITY_L5.toggleClass} ${low ? TT_CINEMATIC_QUALITY_L5.activePulseClass : ""}`}
      aria-pressed={low}
      title={`${label} — ${help}`}
      data-tt-traveltrust-cinematic-low-quality={low ? "1" : "0"}
      data-tt-traveltrust-cinematic-quality-pref={pref}
      data-tt-traveltrust-cinematic-quality-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      {compact ? t("traveltrust_cinematic_quality_toggle_short") : label}
    </motion.button>
  );
}
