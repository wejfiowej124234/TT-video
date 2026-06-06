"use client";

import { useEffect, useState } from "react";

const POWER_SELECTOR = '[data-tt-traveltrust-page-cinematic-power]';

/** 订阅全页 WebGL 省电状态（TT-PH1-090 · ①） */
export function useTraveltrustPageCinematicPowerActive(): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const read = () => {
      const el = document.querySelector(POWER_SELECTOR);
      if (!el) {
        setActive(false);
        return;
      }
      setActive(el.getAttribute("data-tt-traveltrust-page-cinematic-power") === "active");
    };

    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-tt-traveltrust-page-cinematic-power"],
    });
    return () => obs.disconnect();
  }, []);

  return active;
}
