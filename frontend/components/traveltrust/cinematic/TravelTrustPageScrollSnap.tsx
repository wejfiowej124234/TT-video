"use client";

import { useEffect } from "react";
import { resetTraveltrustPageScrollChapterStepCooldown } from "@/lib/traveltrustPageScrollChapterStep";
import { TT_PAGE_SCROLL_SNAP_L5 } from "@/lib/traveltrust/l5";

type Props = {
  layoutReady?: boolean;
};

/**
 * 全页章节吸附已关闭（产品：恢复普通滚动）。
 * 挂载时清理历史会话可能残留的 `html` snap class。
 * 重新启用：在 `TravelTrustNetworkPageMain` 挂载本组件并恢复 `enableSnap` 逻辑。
 */
export function TravelTrustPageScrollSnap(_props: Props) {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass);
    html.style.removeProperty("--tt-scroll-padding-top");
    delete html.dataset.ttScrollSnapStrength;
    delete html.dataset.ttTraveltrustScrollSnap;
    resetTraveltrustPageScrollChapterStepCooldown();
  }, []);

  return null;
}
