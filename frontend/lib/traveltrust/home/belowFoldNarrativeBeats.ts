import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";

/** Below-fold 叙事节拍 SSOT（module 线上 · cinematic 契约锚点须对拍） */
export const TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS = [
  { kind: "snap", chapterId: "theater", align: "center", sectionIds: ["roles"] as const },
  { kind: "film-divider" },
  {
    kind: "economy-cluster",
    sectionIds: TRAVELTRUST_HOME_LAYOUT_LOCK_L5.belowFold.economyClusterIds,
    scrollChapterBeat: "economy",
  },
  { kind: "film-divider" },
  { kind: "snap", chapterId: "faq", align: "start", sectionIds: ["faq"] as const },
  { kind: "snap", chapterId: "close", align: "start", sectionIds: ["start"] as const, groupedFooter: true },
] as const;

export type TraveltrustHomeBelowFoldBeat = (typeof TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS)[number];

/** 供 parity / closure 扫描的 chapterId 顺序 */
export const TRAVELTRUST_HOME_BELOW_FOLD_CHAPTER_SEQUENCE = TRAVELTRUST_HOME_BELOW_FOLD_NARRATIVE_BEATS.filter(
  (b): b is Extract<TraveltrustHomeBelowFoldBeat, { kind: "snap" }> => b.kind === "snap",
).map((b) => b.chapterId);
