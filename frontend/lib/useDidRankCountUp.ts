"use client";

import { useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatDidRankPrizePoolAmount } from "@/lib/didRankPrizePool";

export function useDidRankCountUp(
  target: number,
  {
    durationMs = 1400,
    enabled = true,
    format = formatDidRankPrizePoolAmount,
    replayKey = "default",
  }: {
    durationMs?: number;
    enabled?: boolean;
    format?: (value: number) => string;
    /** period 等变化时重播 count-up */
    replayKey?: string;
  } = {},
) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const reduceMotion = useReducedMotion();
  const formattedTarget = format(target);
  const completedRef = useRef(false);
  const [display, setDisplay] = useState(() => (reduceMotion ? formattedTarget : format(0)));
  const [settled, setSettled] = useState(reduceMotion);

  useEffect(() => {
    completedRef.current = false;
    setSettled(!!reduceMotion);
    if (!reduceMotion) setDisplay(format(0));
  }, [replayKey, target, reduceMotion, format]);

  useEffect(() => {
    if (!enabled || reduceMotion) {
      setDisplay(formattedTarget);
      setSettled(true);
      return;
    }
    if (completedRef.current) {
      setDisplay(formattedTarget);
      setSettled(true);
      return;
    }
    if (!inView) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(format(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        completedRef.current = true;
        setSettled(true);
      }
    };
    setDisplay(format(0));
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, enabled, format, formattedTarget, inView, reduceMotion, target]);

  return { ref, display, animates: enabled && !reduceMotion && inView, settled };
}
