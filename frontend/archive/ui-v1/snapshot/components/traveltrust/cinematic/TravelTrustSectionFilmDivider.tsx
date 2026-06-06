"use client";

import { motion, useReducedMotion } from "framer-motion";

/** 区块间电影感分隔（轻量，不抢内容） */
export function TravelTrustSectionFilmDivider() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="pointer-events-none relative left-1/2 z-[0] my-1 h-px w-screen max-w-[100vw] -translate-x-1/2"
      aria-hidden
      data-tt-traveltrust-section-film-divider="1"
      initial={reduceMotion ? false : { opacity: 0, scaleX: 0.92 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-20% 0px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(35,206,217,0.22) 50%, transparent 100%)",
      }}
    />
  );
}
