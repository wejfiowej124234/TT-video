"use client";

import { useReducedMotion } from "framer-motion";
import {
  TT_HERO_LETTERBOX_BOTTOM_CLASS,
  TT_HERO_LETTERBOX_TOP_CLASS,
} from "./traveltrustHeroFilmStyles";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";

/** 首屏宽银幕内缘渐变遮幅（unified 3D 时省略顶遮幅，避免压暗地球顶部） */
export function TravelTrustHeroFilmChrome() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <>
      {UNIFIED_PAGE_3D ? null : (
        <div
          className={TT_HERO_LETTERBOX_TOP_CLASS}
          aria-hidden
          data-tt-traveltrust-hero-letterbox="top"
          data-tt-traveltrust-hero-letterbox-tone="gradient"
        />
      )}
      {UNIFIED_PAGE_3D ? null : (
        <div
          className={TT_HERO_LETTERBOX_BOTTOM_CLASS}
          aria-hidden
          data-tt-traveltrust-hero-letterbox="bottom"
          data-tt-traveltrust-hero-letterbox-tone="gradient"
        />
      )}
    </>
  );
}
