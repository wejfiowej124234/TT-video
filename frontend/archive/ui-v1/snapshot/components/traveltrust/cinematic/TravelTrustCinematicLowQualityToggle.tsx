"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import {
  getTraveltrustCinematicQualityPref,
  isTraveltrustCinematicLowQuality,
  setTraveltrustCinematicQualityPref,
} from "@/lib/traveltrustCinematicPerf";

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

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex min-h-[36px] max-w-[9rem] items-center truncate rounded-lg border border-ref-cyan/20 bg-ink-900/55 px-2.5 py-1 text-meta font-medium text-slate-200 transition hover:border-ref-cyan/40 hover:bg-ref-cyan/8 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-cyan/50"
      aria-pressed={low}
      title={label}
      data-tt-traveltrust-cinematic-low-quality={low ? "1" : "0"}
      data-tt-traveltrust-cinematic-quality-pref={pref}
    >
      {compact ? t("traveltrust_cinematic_quality_toggle_short") : label}
    </button>
  );
}
