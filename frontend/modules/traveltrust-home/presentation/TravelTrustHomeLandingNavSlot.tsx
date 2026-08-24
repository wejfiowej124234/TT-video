"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TravelTrustLandingChrome } from "@/lib/traveltrust/home/cinematic-bridge";
import { TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS } from "@/lib/marketingUi";
import { TT_TRAVELTRUST_PAGE_FRAME_CLASS } from "@/lib/traveltrustPageLayout";
import { TT_LANDING_CHROME_L5 } from "@/lib/traveltrust/l5";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

/**
 * 顶栏下 Landing Chrome（portal → body · 含项目动态）
 * 须脱离 `#main-content z-0`，否则 Header z-300 会盖住 L1。
 */
export function TravelTrustHomeLandingNavSlot() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fixedShell = (
    <div
      className={`${TT_LANDING_CHROME_L5.fixedSlotShellClass} ${TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS} ${ttZClass(TT_Z.LANDING_CHROME)} min-h-[5rem] sm:min-h-[5.25rem]`}
      data-tt-traveltrust-landing-nav-slot="fixed"
      data-tt-traveltrust-home-landing-nav-slot="1"
      data-tt-traveltrust-landing-nav-portal="1"
    >
      <div className={TT_TRAVELTRUST_PAGE_FRAME_CLASS}>
        <TravelTrustLandingChrome />
      </div>
    </div>
  );

  return (
    <>
      <div
        className={TT_LANDING_CHROME_L5.fixedSlotSpacerClass}
        aria-hidden
        data-tt-traveltrust-landing-nav-slot-spacer="1"
      />
      {/* Never mount `position:fixed` inside `#main-content` / `isolate` — that containing
          block makes L1 chrome scroll mid-page over allocation copy. Portal to body only. */}
      {mounted ? createPortal(fixedShell, document.body) : null}
    </>
  );
}
