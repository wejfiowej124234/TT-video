"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrust/l5";

/** `/traveltrust/announcements` 页内底光（unified layout 上补长页暖色与点阵） */
export function TravelTrustAnnouncementsPageAtmosphere() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        className={TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.rootClass}
        aria-hidden
        data-tt-traveltrust-announcements-atmosphere="1"
        data-tt-traveltrust-announcements-atmosphere-l5="1"
        data-tt-traveltrust-below-fold-atmosphere-unified-l5="1"
        data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: reduceMotion ? 0 : 1 }}
        transition={{
          duration: TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.fadeDuration,
          ease: TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.ease,
        }}
        style={{ background: TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.unifiedBackground }}
      >
        {!reduceMotion ? (
          <motion.div
            className="absolute inset-0"
            aria-hidden
            animate={{ opacity: [...TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.warmPulseOpacity] }}
            transition={{
              duration: TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.warmPulseDuration,
              repeat: 0,
              ease: "easeInOut",
            }}
            style={{ background: TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.warmPulseBackground }}
          />
        ) : null}
        <div className={TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.topScrimClass} aria-hidden />
        <div className={TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.warmScrimClass} aria-hidden />
      </motion.div>
      <div
        className={TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5.dotGridClass}
        aria-hidden
        data-tt-traveltrust-announcements-dot-grid="1"
      />
    </>
  );
}
