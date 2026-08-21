"use client";

import { createContext, useContext } from "react";
import type { MotionValue } from "framer-motion";

/** 落地页 main 滚动 0→1（Hero 球体坠入剧场） */
export const TravelTrustPageScrollContext = createContext<MotionValue<number> | null>(null);

export function useTravelTrustPageScrollProgress(): MotionValue<number> | null {
  return useContext(TravelTrustPageScrollContext);
}
