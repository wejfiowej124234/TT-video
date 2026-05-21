"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { userHasScrolledPastTraveltrustHero } from "@/lib/traveltrustPageScrollBoot";
import { TT_PAGE_SCROLL_SNAP_L5 } from "@/lib/traveltrustCinematicNonGlobeL5";

function isScrollSnapDisabledByQuery(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tt_snap") === "0";
}

function readScrollSnapStrength(): "proximity" | "mandatory" {
  if (typeof window === "undefined") return "proximity";
  return new URLSearchParams(window.location.search).get("tt_snap") === "mandatory"
    ? "mandatory"
    : "proximity";
}

type Props = {
  layoutReady?: boolean;
};

/**
 * 叙事节距吸附：刷新后**不**自动开 snap（避免误吸 #start）；
 * 用户首次 wheel / touch 后再启用。`?tt_snap=0` 关闭。
 */
export function TravelTrustPageScrollSnap({ layoutReady = true }: Props) {
  const reduceMotion = useReducedMotion();
  const snapEnabledRef = useRef(false);

  useEffect(() => {
    const html = document.documentElement;

    const teardown = () => {
      html.classList.remove(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass);
      delete html.dataset.ttScrollSnapStrength;
      delete html.dataset.ttTraveltrustScrollSnap;
      snapEnabledRef.current = false;
    };

    const enableSnap = () => {
      if (snapEnabledRef.current) return;
      if (!layoutReady || reduceMotion || isScrollSnapDisabledByQuery()) return;
      snapEnabledRef.current = true;
      // 已在下滚时不再挂载 snap，避免 proximity 把视口吸回上一节
      if (userHasScrolledPastTraveltrustHero()) return;
      html.classList.add(TT_PAGE_SCROLL_SNAP_L5.htmlRootClass);
      html.dataset.ttScrollSnapStrength = readScrollSnapStrength();
      html.dataset.ttTraveltrustScrollSnap = "1";
    };

    const onUserScrollIntent = () => {
      enableSnap();
    };

    if (!layoutReady || reduceMotion || isScrollSnapDisabledByQuery()) {
      teardown();
      return;
    }

    teardown();
    window.addEventListener("wheel", onUserScrollIntent, { once: true, passive: true });
    window.addEventListener("touchmove", onUserScrollIntent, { once: true, passive: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PageDown" || e.key === "ArrowDown" || e.key === " ") onUserScrollIntent();
    };
    window.addEventListener("keydown", onKeyDown, { once: true });

    return () => {
      teardown();
      window.removeEventListener("wheel", onUserScrollIntent);
      window.removeEventListener("touchmove", onUserScrollIntent);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [layoutReady, reduceMotion]);

  return null;
}
