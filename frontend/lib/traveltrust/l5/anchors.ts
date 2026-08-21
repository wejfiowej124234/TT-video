/** L5 · 叙事节 data 锚点（DOM · 非 R3F userData） */
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "./meta";

export function traveltrustSectionL5DataAttrs(sectionId: string): Record<string, string> {
  return {
    "data-tt-traveltrust-section-motion-l5": sectionId,
    "data-tt-traveltrust-spacing-section": sectionId,
    "data-tt-traveltrust-cinematic-non-globe-l5": TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
  };
}
