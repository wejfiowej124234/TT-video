"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

/** Hero 区滚动进度 0→1，供 R3F 相机推拉（offset: start→end） */
export const TravelTrustHeroScrollContext = createContext<MotionValue<number> | null>(null);

export function useTravelTrustHeroScrollProgress(): MotionValue<number> | null {
  return useContext(TravelTrustHeroScrollContext);
}
