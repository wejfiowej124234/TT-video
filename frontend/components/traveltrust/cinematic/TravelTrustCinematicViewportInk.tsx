"use client";

import {
  TT_VIEWPORT_INK_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

/** 超宽屏左右护板：盖住固定 WebGL 灰边（TT_Z.VIEWPORT_INK · 低于 TT_Z.HERO_SKY，不挡整块内容） */
export function TravelTrustCinematicViewportInk() {
  return (
    <div
      className={TT_VIEWPORT_INK_L5.rootClass}
      aria-hidden
      data-tt-traveltrust-cinematic-viewport-ink="1"
      data-tt-traveltrust-cinematic-viewport-ink-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
    >
      <div
        className={TT_VIEWPORT_INK_L5.wingLeftClass}
        data-tt-traveltrust-cinematic-viewport-ink-wing="left"
      />
      <div
        className={TT_VIEWPORT_INK_L5.wingRightClass}
        data-tt-traveltrust-cinematic-viewport-ink-wing="right"
      />
    </div>
  );
}
