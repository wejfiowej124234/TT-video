"use client";

import { useEffect, type RefObject } from "react";
import { formatHeroGlobeOpticalPercent, formatHeroGlobeOpticalYPercent } from "@/lib/traveltrustHeroGlobeAlign";

/**
 * 量左栏 globe viewport 中心，写入 `--tt-hero-globe-optical-x/y`（①）
 */
export function useTraveltrustHeroGlobeOpticalAlign(
  viewportRef: RefObject<HTMLElement | null>,
  shellRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    const viewport = viewportRef.current;
    const shell = shellRef.current;
    if (!viewport || !shell) return;

    const apply = () => {
      const vr = viewport.getBoundingClientRect();
      const sr = shell.getBoundingClientRect();
      if (sr.width < 1) return;
      const centerX = vr.left + vr.width * 0.5 - sr.left;
      const centerY = vr.top + vr.height * 0.5 - sr.top;
      shell.style.setProperty("--tt-hero-globe-optical-x", formatHeroGlobeOpticalPercent(centerX / sr.width));
      shell.style.setProperty("--tt-hero-globe-optical-y", formatHeroGlobeOpticalYPercent(centerY / sr.height));
    };

    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(viewport);
    ro.observe(shell);
    window.addEventListener("resize", apply, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [viewportRef, shellRef]);
}
