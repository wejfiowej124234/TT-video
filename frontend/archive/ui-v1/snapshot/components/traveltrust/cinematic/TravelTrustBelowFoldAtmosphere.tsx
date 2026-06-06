"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTraveltrustSectionNav } from "./useTraveltrustSectionNav";

const GLOW_SECTIONS = new Set(["explain", "trust", "settlement", "faq"]);

/** 长页滚动时与 Canvas 叙事对齐的平面环境光（① · 非链上数据） */
export function TravelTrustBelowFoldAtmosphere() {
  const active = useTraveltrustSectionNav();
  const reduceMotion = useReducedMotion();
  const show = GLOW_SECTIONS.has(active);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[1] motion-reduce:hidden"
      aria-hidden
      data-tt-traveltrust-below-fold-atmosphere="1"
      data-tt-traveltrust-below-fold-atmosphere-section={active}
      initial={false}
      animate={{ opacity: show && !reduceMotion ? 1 : 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: [
          "radial-gradient(ellipse 70% 55% at 78% 42%, rgba(35,206,217,0.09) 0%, transparent 62%)",
          "radial-gradient(ellipse 55% 40% at 18% 68%, rgba(12,110,105,0.06) 0%, transparent 58%)",
          "linear-gradient(to bottom, transparent 0%, rgba(3,7,18,0.12) 88%, transparent 100%)",
        ].join(", "),
      }}
    />
  );
}
