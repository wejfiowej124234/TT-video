"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useScroll } from "framer-motion";
import type { TheaterViewportAnchor } from "@/lib/traveltrust/home/cinematic-bridge";
import { useTravelTrustPageBriefContext } from "@/app/traveltrust/TravelTrustPageBriefContext";
import { initTraveltrustCinematicQualityPrefs } from "@/lib/traveltrustCinematicPerf";
import { shouldMountTraveltrustDomLayoutDebug } from "@/lib/traveltrustDomLayoutDebug";
import { shouldMountTraveltrustDomCompositorAudit } from "@/lib/traveltrustDomCompositorAudit";
import { isTravelTrustPageBriefV6, TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";
import { resolveAllRoleMediaUrls } from "@/lib/traveltrustMediaFromBrief";
import { useTraveltrustHashScroll } from "@/hooks/useTraveltrustHashScroll";
import { useHomeEntryGate } from "../context/HomeEntryGateContext";

/** Composer 页级副作用与 scroll 绑定（与 cinematic 实现解耦） */
export function useTraveltrustComposerPage() {
  const { brief, ready } = useTravelTrustPageBriefContext();
  const { markMilestone } = useHomeEntryGate();
  const mainRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [theaterViewport, setTheaterViewport] = useState<TheaterViewportAnchor | null>(null);
  const [domOutlineDebug, setDomOutlineDebug] = useState(false);
  const [domCompositorAudit, setDomCompositorAudit] = useState(false);

  const { scrollYProgress: pageScroll } = useScroll({
    target: mainRef,
    offset: ["start start", "end end"],
  });
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useTraveltrustHashScroll(ready);

  useEffect(() => {
    setDomOutlineDebug(shouldMountTraveltrustDomLayoutDebug());
    setDomCompositorAudit(shouldMountTraveltrustDomCompositorAudit());
    initTraveltrustCinematicQualityPrefs();
  }, []);

  const prefetchRoleVideos = useCallback((briefForMedia: Parameters<typeof resolveAllRoleMediaUrls>[0]) => {
    if (typeof document === "undefined") return;
    for (const role of resolveAllRoleMediaUrls(briefForMedia)) {
      if (!role.mp4 || document.querySelector(`link[data-tt-prefetch-role="${role.mp4}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = role.mp4;
      link.setAttribute("data-tt-prefetch-role", role.mp4);
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (ready) markMilestone("brief");
  }, [ready, markMilestone]);

  useEffect(() => {
    if (typeof window === "undefined" || !ready) return;
    const v6 = brief && isTravelTrustPageBriefV6(brief) ? brief : null;
    prefetchRoleVideos(v6);
  }, [brief, prefetchRoleVideos, ready]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    prefetchRoleVideos(TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK);
  }, [prefetchRoleVideos]);

  const onTheaterViewportChange = useCallback((anchor: TheaterViewportAnchor | null) => {
    setTheaterViewport((prev) => {
      if (!anchor && !prev) return prev;
      if (
        anchor &&
        prev &&
        Math.abs(prev.centerY - anchor.centerY) < 6 &&
        Math.abs(prev.height - anchor.height) < 6
      ) {
        return prev;
      }
      return anchor;
    });
  }, []);

  return {
    brief,
    ready,
    mainRef,
    heroRef,
    pageScroll,
    heroScroll,
    theaterViewport,
    domOutlineDebug,
    domCompositorAudit,
    onTheaterViewportChange,
  };
}
