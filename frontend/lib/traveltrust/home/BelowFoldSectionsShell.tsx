"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  TT_BELOW_FOLD_SCROLL_PLATE_L5,
  TT_BELOW_HERO_FADE_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

type Props = {
  children: ReactNode;
  /** 线上 module 编排器标记（cinematic 契约锚点不传） */
  moduleOrchestrator?: boolean;
};

/** Below-fold 外壳 SSOT（module 线上 + cinematic 契约锚点共用） */
export function TravelTrustHomeBelowFoldShell({ children, moduleOrchestrator }: Props) {
  return (
    <motion.div
      className={`relative ${ttZClass(TT_Z.HERO_SKY)} isolate`}
      data-tt-traveltrust-below-fold-sections="1"
      data-tt-traveltrust-below-fold-sections-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      {...(moduleOrchestrator ? { "data-tt-traveltrust-home-below-fold-orchestrator": "1" } : {})}
    >
      <div
        className={TT_BELOW_FOLD_SCROLL_PLATE_L5.backdropClass}
        aria-hidden
        data-tt-traveltrust-below-fold-scroll-plate-l5="1"
      />
      <div
        className={`${TT_BELOW_HERO_FADE_L5.wrapperClass} ${TT_BELOW_HERO_FADE_L5.heightClass}`}
        style={{ background: TT_BELOW_HERO_FADE_L5.gradient }}
        aria-hidden
        data-tt-traveltrust-below-hero-ink-bridge-l5="1"
      />
      <motion.div className="relative z-[1]">
        <div
          className="pointer-events-none h-0 w-full overflow-hidden"
          aria-hidden
          data-tt-traveltrust-below-hero-fade="1"
          data-tt-traveltrust-below-hero-fade-l5="1"
          data-tt-traveltrust-below-hero-fade-disabled="1"
        />
        {children}
      </motion.div>
    </motion.div>
  );
}
