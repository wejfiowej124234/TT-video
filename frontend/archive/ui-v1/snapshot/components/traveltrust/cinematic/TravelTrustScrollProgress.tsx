"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useTranslation } from "@/components/LocaleProvider";
import { traveltrustSectionLabelKey } from "@/lib/traveltrustSectionNavItems";
import { useTraveltrustPageCinematicPowerActive } from "@/lib/useTraveltrustPageCinematicPower";
import { useTraveltrustSectionNav } from "./useTraveltrustSectionNav";

export function TravelTrustScrollProgress() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const canvasActive = useTraveltrustPageCinematicPowerActive();
  const activeSection = useTraveltrustSectionNav();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });
  const chapterLabel = t(traveltrustSectionLabelKey(activeSection));

  if (reduceMotion) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 right-0 top-0 z-[29] h-0.5 origin-left bg-gradient-to-r from-ref-sun via-ref-teal to-ref-cyan motion-reduce:hidden"
        style={{ scaleX }}
        aria-hidden
        data-tt-traveltrust-scroll-progress="1"
        data-tt-traveltrust-scroll-progress-visible={canvasActive ? "1" : "0"}
        initial={false}
        animate={{ opacity: canvasActive ? 1 : 0 }}
        transition={{ duration: 0.28 }}
      />
      <motion.p
        className="pointer-events-none fixed bottom-4 right-4 z-[28] hidden max-w-[12rem] truncate rounded-lg border border-white/12 bg-[#0a0908]/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ref-cyan/90 shadow-lg backdrop-blur-md sm:block motion-reduce:hidden"
        aria-hidden
        data-tt-traveltrust-scroll-chapter="1"
        data-tt-traveltrust-scroll-chapter-id={activeSection}
        initial={false}
        animate={{ opacity: canvasActive ? 1 : 0, y: canvasActive ? 0 : 6 }}
        transition={{ duration: 0.28 }}
        key={activeSection}
      >
        {chapterLabel}
      </motion.p>
    </>
  );
}
