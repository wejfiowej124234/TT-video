"use client";



import { motion, useReducedMotion } from "framer-motion";

import {
  TT_HERO_LETTERBOX_BOTTOM_CLASS,
  TT_HERO_LETTERBOX_TOP_CLASS,
} from "./traveltrustHeroFilmStyles";
import { TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID } from "@/lib/traveltrust/l5";
import { UNIFIED_PAGE_3D } from "./traveltrustPageCinematicConfig";

/** 首屏宽银幕遮幅 · legacy 非 unified 页用；unified 3D 已去掉顶/底横条（避免 `#030712` 冷色带） */

export function TravelTrustHeroFilmChrome() {
  const reduceMotion = useReducedMotion();

  /** unified：不再叠顶/底 letterbox（人眼呈「球后蓝紫横条」） */
  if (UNIFIED_PAGE_3D) {
    return null;
  }



  if (reduceMotion) return null;



  return (
    <motion.div
      aria-hidden
      data-tt-traveltrust-hero-film-chrome-l5="1"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      className="pointer-events-none absolute inset-0 z-[2]"
    >

      <motion.div

        className={TT_HERO_LETTERBOX_TOP_CLASS}

        aria-hidden

        data-tt-traveltrust-hero-letterbox="top"

        data-tt-traveltrust-hero-letterbox-tone="gradient"

      />

      <motion.div

        className={TT_HERO_LETTERBOX_BOTTOM_CLASS}

        aria-hidden

        data-tt-traveltrust-hero-letterbox="bottom"

        data-tt-traveltrust-hero-letterbox-tone="gradient"

      />
    </motion.div>
  );

}


