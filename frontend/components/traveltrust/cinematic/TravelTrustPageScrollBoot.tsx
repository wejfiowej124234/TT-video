"use client";

import { useEffect } from "react";
import {
  armTraveltrustScrollRestorationManual,
  scheduleTraveltrustHeroPin,
} from "@/lib/traveltrustPageScrollBoot";

/** 挂载即锁 Hero 顶 + bfcache；与 hash 深链 hook / scroll-snap 分工 */
export function TravelTrustPageScrollBoot() {
  useEffect(() => {
    armTraveltrustScrollRestorationManual();
    const cancelPins = scheduleTraveltrustHeroPin([0, 80, 240, 600]);

    const onPageShow = () => {
      armTraveltrustScrollRestorationManual();
      scheduleTraveltrustHeroPin([0, 100, 400, 900]);
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      cancelPins();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
