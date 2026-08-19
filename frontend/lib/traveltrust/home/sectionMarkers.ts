import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";

/** 首页 module 节边界 DOM 标记（与 layout lock sectionOrder 对齐） */
export const TRAVELTRUST_HOME_SECTION_MARKER_ATTR = "data-tt-traveltrust-home-section" as const;

export const TRAVELTRUST_HOME_SECTION_IDS = [
  ...TRAVELTRUST_HOME_LAYOUT_LOCK_L5.sectionOrder,
  ...TRAVELTRUST_HOME_LAYOUT_LOCK_L5.archivedSectionIds,
] as const;

export function traveltrustHomeSectionMarker(id: (typeof TRAVELTRUST_HOME_SECTION_IDS)[number]): {
  [TRAVELTRUST_HOME_SECTION_MARKER_ATTR]: string;
} {
  return { [TRAVELTRUST_HOME_SECTION_MARKER_ATTR]: id };
}
