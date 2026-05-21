"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TT_START_ROUTE_PREVIEW_L5, TT_START_STEP_CYCLE_MS } from "@/lib/traveltrustCinematicNonGlobeL5";
import {
  TRAVELTRUST_START_L5_STEP_IDS,
  type TraveltrustStartL5StepId,
} from "@/lib/traveltrustStartStepIds";

export const TRAVELTRUST_START_L5_STEPS = TRAVELTRUST_START_L5_STEP_IDS;
export type { TraveltrustStartL5StepId };

export type TraveltrustStartStepController = {
  activeStep: number;
  selectStep: (index: number) => void;
  pauseCycle: () => void;
  resumeCycle: () => void;
};

/** #start 三步：自动轮播 + 悬停暂停 + 点击 pill 同步示意卡 */
export function useTraveltrustStartStepController(
  reduceMotion: boolean | null,
): TraveltrustStartStepController {
  const [activeStep, setActiveStep] = useState(0);
  const [cyclePaused, setCyclePaused] = useState(false);
  const pauseFromHoverRef = useRef(false);
  const manualHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearManualHold = useCallback(() => {
    if (manualHoldTimerRef.current) {
      window.clearTimeout(manualHoldTimerRef.current);
      manualHoldTimerRef.current = null;
    }
  }, []);

  const selectStep = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), TRAVELTRUST_START_L5_STEPS.length - 1);
      setActiveStep(clamped);
      setCyclePaused(true);
      clearManualHold();
      manualHoldTimerRef.current = window.setTimeout(() => {
        manualHoldTimerRef.current = null;
        if (!pauseFromHoverRef.current) setCyclePaused(false);
      }, TT_START_ROUTE_PREVIEW_L5.manualHoldAfterSelectMs);
    },
    [clearManualHold],
  );

  const pauseCycle = useCallback(() => {
    pauseFromHoverRef.current = true;
    setCyclePaused(true);
  }, []);

  const resumeCycle = useCallback(() => {
    pauseFromHoverRef.current = false;
    if (manualHoldTimerRef.current) return;
    setCyclePaused(false);
  }, []);

  useEffect(() => {
    if (reduceMotion || cyclePaused) return;
    const id = window.setInterval(
      () => setActiveStep((s) => (s + 1) % TRAVELTRUST_START_L5_STEPS.length),
      TT_START_STEP_CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [reduceMotion, cyclePaused]);

  useEffect(() => () => clearManualHold(), [clearManualHold]);

  return { activeStep, selectStep, pauseCycle, resumeCycle };
}

/** @deprecated Prefer `useTraveltrustStartStepController` — returns active index only */
export function useTraveltrustStartStepCycle(reduceMotion: boolean | null): number {
  return useTraveltrustStartStepController(reduceMotion).activeStep;
}
