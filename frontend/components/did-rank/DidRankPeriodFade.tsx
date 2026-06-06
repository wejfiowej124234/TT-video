"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Period } from "@/lib/didRankUtils";

/** period 切换时榜体淡入；刷新时降低不透明度（无位移，避免文字跳动） */
export function DidRankPeriodFade({
  period,
  isRefreshing = false,
  children,
}: {
  period: Period;
  isRefreshing?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { duration: 0.01, ease: "linear" as const }
    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={period}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: isRefreshing ? 0.65 : 1 }}
        exit={reduceMotion ? undefined : { opacity: 0 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
