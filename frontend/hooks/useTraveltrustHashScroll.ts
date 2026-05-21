"use client";

import { useEffect } from "react";
import {
  armTraveltrustScrollRestorationManual,
  pinTraveltrustPageTop,
  scheduleTraveltrustHeroPin,
  shouldPinTraveltrustHeroOnLoad,
  shouldPinTraveltrustHeroNow,
  traveltrustPageScrollY,
} from "@/lib/traveltrustPageScrollBoot";
import { normalizeTraveltrustHash, scrollTraveltrustHashIntoView } from "@/lib/traveltrustSectionHash";

/**
 * 首访与 hashchange 深链滚动（TT-PH1-022 · ①）
 * @param resyncWhen 为 true 时重跑（如 page-brief hydration 后 below-fold 高度稳定）
 */
export function useTraveltrustHashScroll(resyncWhen = true) {
  /** 挂载即锁顶：不等待 page-brief，避免刷新先落在历史 #start 位置 */
  useEffect(() => {
    armTraveltrustScrollRestorationManual();
    if (!shouldPinTraveltrustHeroOnLoad()) return;
    return scheduleTraveltrustHeroPin([50, 180, 500, 1200]);
  }, []);

  useEffect(() => {
    if (resyncWhen === false) return;

    armTraveltrustScrollRestorationManual();

    const sync = (behavior: ScrollBehavior = "auto") => {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const id = normalizeTraveltrustHash(hash);
      if (!id || id === "hero") {
        // brief hydration 后勿把已下滚用户拽回顶（常见「闪回 Hero」）
        if (shouldPinTraveltrustHeroNow() && traveltrustPageScrollY() <= 8) pinTraveltrustPageTop();
        return;
      }
      scrollTraveltrustHashIntoView(hash, { behavior });
    };

    sync("auto");
    const onHashChange = () => sync("smooth");
    window.addEventListener("hashchange", onHashChange);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [resyncWhen]);
}
