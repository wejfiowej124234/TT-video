/** v6 章节入场分轨（波次 2.1 · 与 traveltrustCinematicMotion 同源） */
import type { Transition, TargetAndTransition } from "framer-motion";
import { TT_CINEMATIC_EASE } from "./traveltrustCinematicMotion";
import { TT_FOOTER_L5_SEQUENTIAL, TT_SECTION_MOTION_L5 } from "@/lib/traveltrust/l5";

export type TraveltrustSectionMotionId =
  | "theater"
  | "liquidity"
  | "trust"
  | "settlement"
  | "faq"
  | "start";

type SectionMotionPreset = {
  initial?: TargetAndTransition | false;
  whileInView?: TargetAndTransition;
  transition: Transition;
};

const PRESETS: Record<TraveltrustSectionMotionId, SectionMotionPreset> = {
  theater: {
    initial: { opacity: 0, y: 24, scale: 0.995 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: TT_SECTION_MOTION_L5.theater.duration, ease: TT_CINEMATIC_EASE },
  },
  liquidity: {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: TT_SECTION_MOTION_L5.liquidity.duration, ease: TT_CINEMATIC_EASE },
  },
  trust: {
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: TT_SECTION_MOTION_L5.trust.duration, ease: TT_CINEMATIC_EASE },
  },
  settlement: {
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: TT_SECTION_MOTION_L5.settlement.duration, ease: TT_CINEMATIC_EASE },
  },
  faq: {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: TT_SECTION_MOTION_L5.faq.duration, ease: TT_CINEMATIC_EASE },
  },
  start: {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: TT_SECTION_MOTION_L5.start.duration, ease: TT_CINEMATIC_EASE },
  },
};

export function traveltrustSectionMotionProps(
  id: TraveltrustSectionMotionId,
  reduceMotion: boolean | null,
): {
  initial: TargetAndTransition | false | undefined;
  whileInView: TargetAndTransition | undefined;
  viewport: { once: true; margin: string };
  transition: Transition;
} {
  const preset = PRESETS[id];
  const viewport =
    id === "settlement"
      ? { once: true as const, margin: "-8% 0px" }
      : { once: true as const, margin: "-12% 0px" };

  if (reduceMotion) {
    return { initial: false, whileInView: undefined, viewport, transition: { duration: 0 } };
  }

  return {
    initial: preset.initial,
    whileInView: preset.whileInView,
    viewport,
    transition: preset.transition,
  };
}

export function traveltrustSectionChildStagger(
  index: number,
  reduceMotion: boolean | null,
  base = 0.06,
): Transition {
  if (reduceMotion) return { duration: 0 };
  return {
    duration: TT_SECTION_MOTION_L5.childStaggerDuration,
    delay: index * base,
    ease: TT_CINEMATIC_EASE,
  };
}

/** L5 · 区块内子项波次入场（启程步骤 / 页脚链） */
export function traveltrustL5SequentialChildProps(
  index: number,
  reduceMotion: boolean | null,
  opts?: { baseDelay?: number; step?: number },
) {
  const step = opts?.step ?? TT_FOOTER_L5_SEQUENTIAL.linkStagger;
  const baseDelay = opts?.baseDelay ?? 0;
  if (reduceMotion) {
    return { initial: false as const, animate: undefined, transition: { duration: 0 } };
  }
  return {
    initial: { opacity: 0, y: TT_FOOTER_L5_SEQUENTIAL.childEntranceY },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true as const, margin: "-8% 0px" },
    transition: {
      duration: TT_FOOTER_L5_SEQUENTIAL.childEntranceDuration,
      delay: baseDelay + index * step,
      ease: TT_CINEMATIC_EASE,
    },
  };
}
