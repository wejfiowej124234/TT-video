"use client";

import { useEffect, useRef } from "react";
import type { PesTouchpoint } from "./productEnhancementSprint";
import { getActiveAbTestsForTouchpoint } from "./conversionAnalyticsAbRegistry";
import {
  getPesAbVariant,
  trackPesAbExposure,
  trackPesTouchpointView,
} from "./conversionAnalyticsLayer";

/** 触点曝光 + 活跃 A/B 实验曝光（每 session 每触点一次） */
export function usePesTouchpointImpression(touchpoint: PesTouchpoint): void {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPesTouchpointView(touchpoint);
    for (const test of getActiveAbTestsForTouchpoint(touchpoint)) {
      const variant = getPesAbVariant(test);
      trackPesAbExposure(touchpoint, test.id, variant);
    }
  }, [touchpoint]);
}
