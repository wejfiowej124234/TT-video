"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  TT_SECTION_FILM_DIVIDER_HANDOFF_L5,
  TT_SECTION_FILM_DIVIDER_L5,
  TT_SECTION_FILM_DIVIDER_MOTION_L5,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
} from "@/lib/traveltrustCinematicNonGlobeL5";

/** 区块间电影感分隔（L5 · 暖色光带） */
export function TravelTrustSectionFilmDivider() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={TT_SECTION_FILM_DIVIDER_HANDOFF_L5.wrapperClass}
      aria-hidden
      data-tt-traveltrust-section-film-divider="1"
      data-tt-traveltrust-section-film-divider-l5="1"
      data-tt-traveltrust-section-film-divider-handoff-l5="1"
      data-tt-traveltrust-spacing-gap="film"
      data-tt-traveltrust-cinematic-non-globe-l5={TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID}
      initial={reduceMotion ? false : { opacity: 0, scaleX: 0.92 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-20% 0px" }}
      transition={{
        duration: TT_SECTION_FILM_DIVIDER_MOTION_L5.duration,
        ease: TT_SECTION_FILM_DIVIDER_MOTION_L5.ease,
      }}
    >
      <motion.div
        className={TT_SECTION_FILM_DIVIDER_HANDOFF_L5.lineClass}
        aria-hidden
        style={{ background: TT_SECTION_FILM_DIVIDER_L5 }}
        initial={reduceMotion ? false : { scaleX: 0.92 }}
        whileInView={reduceMotion ? undefined : { scaleX: 1 }}
        viewport={{ once: true, margin: "-20% 0px" }}
        transition={{
          duration: TT_SECTION_FILM_DIVIDER_MOTION_L5.duration,
          ease: TT_SECTION_FILM_DIVIDER_MOTION_L5.ease,
        }}
      />
      {!reduceMotion ? (
        <motion.span
          className={`${TT_SECTION_FILM_DIVIDER_HANDOFF_L5.lineClass} bg-[linear-gradient(90deg,transparent,rgba(255,232,212,0.35),transparent)]`}
          aria-hidden
          animate={{ x: ["-120%", "120%"] }}
          transition={{
            duration: TT_SECTION_FILM_DIVIDER_MOTION_L5.shimmerDuration,
            repeat: TT_SECTION_FILM_DIVIDER_MOTION_L5.shimmerRepeat,
            ease: "easeInOut",
          }}
        />
      ) : null}
    </motion.div>
  );
}
