"use client";

import { useEffect } from "react";
import {
  applyTraveltrustDomLayoutOutlineDebug,
  clearTraveltrustDomLayoutOutlineDebug,
} from "@/lib/traveltrustDomLayoutDebug";

/** DevTools 快检：`/traveltrust?tt_dom_outline=1` 给带 background 的容器描边 */
export function TravelTrustDomLayoutDebug() {
  useEffect(() => {
    applyTraveltrustDomLayoutOutlineDebug();
    const onResize = () => applyTraveltrustDomLayoutOutlineDebug();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTraveltrustDomLayoutOutlineDebug();
    };
  }, []);

  return (
    <div
      className="fixed bottom-20 left-4 z-[220] rounded-lg border border-amber-400/40 bg-ink-950/90 px-3 py-2 text-meta text-amber-100/90 shadow-lg backdrop-blur-sm"
      role="status"
      data-tt-traveltrust-dom-outline-debug="1"
    >
      DOM outline 已开启（红边 = 非透明 background）。移除参数 <code className="text-amber-200">tt_dom_outline</code> 即关闭。
    </div>
  );
}
