"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { TRAVELTRUST_HOME_ENTRY_GATE_L5 } from "@/lib/traveltrust/home/constants";
import type { TraveltrustHomeEntryMilestoneId } from "../core/milestones";

const MILESTONE_LABEL_KEYS: Record<TraveltrustHomeEntryMilestoneId, string> = {
  shell: "traveltrust_home_entry_stage_shell",
  brief: "traveltrust_home_entry_stage_brief",
  cinematic: "traveltrust_home_entry_stage_cinematic",
  hero: "traveltrust_home_entry_stage_hero",
  sections: "traveltrust_home_entry_stage_sections",
};

type Props = {
  visible: boolean;
  progress: number;
  activeMilestone: TraveltrustHomeEntryMilestoneId | null;
  /** route：Next loading.tsx 用不确定进度 */
  variant?: "gate" | "route";
};

export function TravelTrustHomeEntryOverlay({
  visible,
  progress,
  activeMilestone,
  variant = "gate",
}: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [routeProgress, setRouteProgress] = useState(22);

  useEffect(() => {
    if (variant !== "route") return;
    let value = 22;
    const id = globalThis.setInterval(() => {
      value = Math.min(88, value + 5);
      setRouteProgress(value);
    }, 140);
    return () => globalThis.clearInterval(id);
  }, [variant]);

  const displayProgress = variant === "route" ? routeProgress : progress;
  const stageKey = activeMilestone ? MILESTONE_LABEL_KEYS[activeMilestone] : "traveltrust_home_entry_stage_shell";
  const stageLabel = t(stageKey);

  if (!visible && variant === "gate") return null;

  return (
    <motion.div
      className={`fixed inset-x-0 bottom-0 z-[110] flex flex-col items-center justify-center bg-[#0c0a09] px-6 ${TRAVELTRUST_HOME_ENTRY_GATE_L5.overlayInsetTopClass}`}
      role="status"
      aria-live="polite"
      aria-busy={visible ? "true" : "false"}
      aria-label={t("traveltrust_home_entry_loading")}
      data-tt-traveltrust-home-entry-overlay="1"
      data-tt-traveltrust-home-entry-variant={variant}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}
      transition={{ duration: reduceMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_38%,rgba(252,164,124,0.12),transparent_68%)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md text-center">
        <p className="text-h4 font-bold tracking-tight text-slate-100">TravelTrust</p>
        <p className="mt-2 text-meta text-slate-300/90">{t("traveltrust_home_entry_loading")}</p>
        <div
          className="mt-8 h-2 w-full overflow-hidden rounded-full border border-ref-sun/22 bg-ink-950/80"
          data-tt-traveltrust-home-entry-progress-track="1"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-ref-sun/70 via-ref-coral/85 to-amber-200/80 shadow-[0_0_24px_-6px_rgba(252,164,124,0.55)]"
            data-tt-traveltrust-home-entry-progress-bar="1"
            initial={false}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-4 font-mono text-small tabular-nums text-ref-sun/90">
          {Math.round(displayProgress)}%
        </p>
        {variant === "gate" ? (
          <p className="mt-2 text-meta text-slate-400/95">{stageLabel}</p>
        ) : null}
      </div>
    </motion.div>
  );
}
