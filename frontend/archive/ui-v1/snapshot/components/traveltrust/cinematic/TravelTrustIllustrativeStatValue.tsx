"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { parseIllustrativeStatNumber } from "@/lib/parseIllustrativeStatNumber";

type Props = {
  valueKey: string;
  footnoteId: string;
  statId: string;
};

/** Illustrative stat number with optional count-up when entering viewport (①). */
export function TravelTrustIllustrativeStatValue({ valueKey, footnoteId, statId }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12% 0px" });
  const raw = t(valueKey);
  const target = parseIllustrativeStatNumber(raw);
  const [display, setDisplay] = useState(raw);

  useEffect(() => {
    if (!inView || reduceMotion || target === null) {
      setDisplay(raw);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const durationMs = 880;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(String(Math.round(target * eased)));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    setDisplay("0");
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduceMotion, raw, target]);

  return (
    <motion.dd
      ref={ref}
      className="mt-1 text-h4 font-bold tabular-nums text-white"
      aria-describedby={footnoteId}
      data-tt-traveltrust-stat-value={statId}
      data-tt-traveltrust-stat-count-up={target !== null && !reduceMotion ? "1" : "0"}
    >
      {display}
    </motion.dd>
  );
}
