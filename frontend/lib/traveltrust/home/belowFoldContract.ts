import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";
import {
  TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE,
  TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS,
} from "./belowFoldNarrativeBeats";

export {
  TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE,
  TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS,
};

/** 模块 below-fold 与 cinematic 锚点共享的 DOM 契约标记 */
export const TRAVELTRUST_HOME_BELOW_FOLD_SHELL_MARKERS = [
  'data-tt-traveltrust-below-fold-sections="1"',
  'data-tt-traveltrust-below-fold-sections-l5="1"',
  "data-tt-traveltrust-below-fold-scroll-plate-l5",
  "data-tt-traveltrust-below-hero-ink-bridge-l5",
  'data-tt-traveltrust-below-hero-fade-disabled="1"',
] as const;

/** @deprecated 使用 TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS */
export const TRAVELTRUST_HOME_BELOW_FOLD_SNAP_CHAPTERS = TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS.filter(
  (b): b is Extract<(typeof TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS)[number], { kind: "snap" }> =>
    b.kind === "snap",
).map((b) => ({ chapterId: b.chapterId, section: b.sectionIds[0] }));
export const TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_JSX_TAG = "<TravelTrustSectionFilmDivider";

export const TRAVELTRUST_HOME_BELOW_FOLD_FILM_DIVIDER_COUNT =
  TRAVELTRUST_HOME_LAYOUT_LOCK_L5.filmDividerCount;
