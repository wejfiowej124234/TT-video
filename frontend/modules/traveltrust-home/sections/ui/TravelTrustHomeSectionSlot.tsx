"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TT_L5_MOTION_EASE, TT_SECTION_MOTION_L5 } from "@/lib/traveltrust/l5";
import {
  TRAVELTRUST_HOME_SECTION_IDS,
  traveltrustHomeSectionMarker,
} from "@/lib/traveltrust/home/sectionMarkers";

type SectionId = Exclude<(typeof TRAVELTRUST_HOME_SECTION_IDS)[number], "hero">;

type Props = {
  sectionId: SectionId;
  children: ReactNode;
  className?: string;
};

const SLOT_MOTION_DURATION: Partial<Record<SectionId, number>> = {
  trust: TT_SECTION_MOTION_L5.trust.duration,
  settlement: TT_SECTION_MOTION_L5.settlement.duration,
  unlock: TT_SECTION_MOTION_L5.unlock.duration,
  liquidity: TT_SECTION_MOTION_L5.liquidity.duration,
  faq: TT_SECTION_MOTION_L5.faq.duration,
  start: TT_SECTION_MOTION_L5.start.duration,
};

/** 首页 module 节边界槽位（P3 · UI 归属 module 的 DOM 壳 · L5 入场） */
export function TravelTrustHomeSectionSlot({ sectionId, children, className }: Props) {
  const reduceMotion = useReducedMotion();
  const duration = SLOT_MOTION_DURATION[sectionId];
  const marker = traveltrustHomeSectionMarker(sectionId);
  if (duration == null) {
    return (
      <div {...marker} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      {...marker}
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: reduceMotion ? 0 : duration, ease: TT_L5_MOTION_EASE }}
    >
      {children}
    </motion.div>
  );
}
