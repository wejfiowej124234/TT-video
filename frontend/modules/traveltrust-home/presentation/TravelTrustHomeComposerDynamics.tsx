"use client";

import dynamic from "next/dynamic";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";
import {
  loadTravelTrustDomCompositorAudit,
  loadTravelTrustDomLayoutDebug,
  loadTravelTrustLandingChrome,
  loadTravelTrustPageScrollBoot,
  loadTravelTrustScrollProgress,
  loadTravelTrustSectionSpacingDebug,
} from "@/lib/traveltrust/home/cinematic-bridge";

function ChromeNavPlaceholder() {
  return (
    <div
      className={`sticky top-14 ${ttZClass(TT_Z.CONTENT)} -mx-4 mb-2 h-14 border-b border-ref-sun/14 bg-[#0a0908]/92 sm:-mx-6`}
      aria-hidden
      data-tt-traveltrust-chrome-placeholder="1"
    />
  );
}

/** Composer 层 dynamic chunk（landing chrome · scroll · debug · boot） */
export const TravelTrustHomeLandingChrome = dynamic(loadTravelTrustLandingChrome, {
  ssr: true,
  loading: () => <ChromeNavPlaceholder />,
});

export const TravelTrustHomeScrollProgress = dynamic(loadTravelTrustScrollProgress, { ssr: false });

export const TravelTrustHomeSectionSpacingDebug = dynamic(loadTravelTrustSectionSpacingDebug, {
  ssr: false,
});

export const TravelTrustHomeDomLayoutDebug = dynamic(loadTravelTrustDomLayoutDebug, { ssr: false });

export const TravelTrustHomeDomCompositorAudit = dynamic(loadTravelTrustDomCompositorAudit, {
  ssr: false,
});

export const TravelTrustHomePageScrollBoot = dynamic(loadTravelTrustPageScrollBoot, { ssr: false });
