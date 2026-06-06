"use client";

import { useEffect } from "react";
import {
  armTraveltrustScrollRestorationManual,
  scheduleTraveltrustHeroPin,
} from "@/lib/traveltrustPageScrollBoot";
import { resetTraveltrustPageScrollChapterStepCooldown } from "@/lib/traveltrustPageScrollChapterStep";
import { TT_PAGE_SCROLL_SNAP_L5 } from "@/lib/traveltrust/l5";

/** 挂载即锁 Hero 顶 + bfcache；全页 scroll-snap 已关闭（见 `TRAVELTRUST_HOME_LAYOUT_LOCK_L5`），此处清理残留 class */
export function TravelTrustPageScrollBoot() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass);
    html.style.removeProperty("--tt-scroll-padding-top");
    delete html.dataset.ttScrollSnapStrength;
    delete html.dataset.ttTraveltrustScrollSnap;
    resetTraveltrustPageScrollChapterStepCooldown();

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
