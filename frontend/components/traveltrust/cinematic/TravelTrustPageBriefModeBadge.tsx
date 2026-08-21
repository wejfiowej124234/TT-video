"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import {
  TT_BRIEF_BADGE_L5,
  TT_BRIEF_BADGE_LIVE_L5_CLASS,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

type Props = {
  /** 嵌入 landing chrome 时更矮 */
  compact?: boolean;
};

/** 顶栏 Live / Demo（波次 5.1 · ①） */
export function TravelTrustPageBriefModeBadge({ compact = false }: Props) {
  const { t } = useTranslation();
  const { brief, ready, degraded, source } = useTravelTrustPageBriefContext();
  const shellClass = compact
    ? TT_BRIEF_BADGE_L5.chromeCompactClass
    : "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider";

  if (!ready) {
    return (
      <span
        className={`${shellClass} border-ref-sun/20 bg-ref-sun/6 text-ref-sun/50`}
        aria-hidden
        data-tt-traveltrust-page-brief-badge-skeleton="1"
        data-tt-traveltrust-page-brief-badge-compact={compact ? "1" : "0"}
      >
        {t("traveltrust_page_brief_mode_live")}
      </span>
    );
  }

  const demo = degraded || source !== "api";
  const label = demo ? t("traveltrust_page_brief_mode_demo") : t("traveltrust_page_brief_mode_live");
  const title = demo
    ? t("traveltrust_page_brief_degraded")
    : t("traveltrust_page_brief_mode_live_hint", {
        version: brief?.allocation_ssot?.protocol_reference_doc_version ?? "—",
      });

  if (demo) {
    return (
      <motion.span
        className={`${shellClass} ${TT_BRIEF_BADGE_L5.demoClass}`}
        animate={{ opacity: [...TT_BRIEF_BADGE_L5.demoOpacityRange] }}
        transition={{
          duration: TT_BRIEF_BADGE_L5.demoPulseDuration,
          repeat: TT_BRIEF_BADGE_L5.demoPulseRepeat,
          ease: "easeInOut",
        }}
        data-tt-traveltrust-page-brief-mode="demo"
        data-tt-traveltrust-page-brief-badge-l5="1"
        data-tt-traveltrust-page-brief-badge-demo-pulse-l5="1"
        data-tt-traveltrust-page-brief-badge-compact={compact ? "1" : "0"}
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        title={title}
      >
        {label}
      </motion.span>
    );
  }

  return (
    <motion.span
      className={`${shellClass} ${TT_BRIEF_BADGE_LIVE_L5_CLASS}`}
      animate={{ opacity: [...TT_BRIEF_BADGE_L5.liveOpacityRange] }}
      transition={{
        duration: TT_BRIEF_BADGE_L5.livePulseDuration,
        repeat: TT_BRIEF_BADGE_L5.livePulseRepeat,
        ease: "easeInOut",
      }}
      data-tt-traveltrust-page-brief-mode="live"
      data-tt-traveltrust-page-brief-badge-l5="1"
      data-tt-traveltrust-page-brief-badge-compact={compact ? "1" : "0"}
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      title={title}
    >
      {label}
    </motion.span>
  );
}
