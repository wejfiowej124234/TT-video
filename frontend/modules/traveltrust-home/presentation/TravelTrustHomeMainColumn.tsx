"use client";

import type { RefObject } from "react";
import { UNIFIED_PAGE_3D, type TheaterViewportAnchor } from "@/lib/traveltrust/home/cinematic-bridge";
import {
  TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
  TT_HERO_SPLIT_CSS_VARS_STYLE,
} from "@/lib/traveltrustHeroSplitLayout";
import {
  TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS,
  TT_TRAVELTRUST_PAGE_FRAME_CLASS,
} from "@/lib/traveltrustPageLayout";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";
import { TravelTrustHomeBelowFoldSection } from "../sections/TravelTrustHomeBelowFoldSection";
import { TravelTrustHomeHeroSection } from "../sections/TravelTrustHomeHeroSection";
import { TravelTrustHomeLandingNavSlot } from "./TravelTrustHomeLandingNavSlot";
import { TravelTrustHomeUnified3DBackdrop } from "./TravelTrustHomeUnified3DBackdrop";

type Props = {
  mainRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLElement | null>;
  textDirection: "ltr" | "rtl";
  ready: boolean;
  ariaLabel: string;
  skipToHeroLabel: string;
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

export function TravelTrustHomeMainColumn({
  mainRef,
  heroRef,
  textDirection,
  ready,
  ariaLabel,
  skipToHeroLabel,
  onTheaterViewportChange,
}: Props) {
  return (
    <>
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[30] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-2 focus:text-small focus:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50"
      >
        {skipToHeroLabel}
      </a>
      <main
        ref={mainRef}
        dir={textDirection}
        className={`relative ${ttZClass(TT_Z.VIEWPORT_INK)} min-h-screen${UNIFIED_PAGE_3D ? " bg-[#0c0a09]" : ""}`}
        style={{
          position: "relative",
          ...TT_HERO_SPLIT_CSS_VARS_STYLE,
          ["--tt-hero-split-canvas-right" as string]: TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS,
          overflowAnchor: "none",
        }}
        aria-label={ariaLabel}
        data-tt-traveltrust-network-page="1"
        data-tt-traveltrust-ia-version="v6"
        data-tt-ui-generation="v2"
        data-tt-traveltrust-page-brief-ready={ready ? "1" : "0"}
        data-tt-traveltrust-unified-3d={UNIFIED_PAGE_3D ? "1" : "0"}
        data-tt-traveltrust-text-direction={textDirection}
        data-tt-traveltrust-home-composer="1"
        data-tt-traveltrust-home-main-column="1"
      >
        <TravelTrustHomeUnified3DBackdrop />
        <TravelTrustHomeLandingNavSlot />
        <TravelTrustHomeHeroSection heroRef={heroRef} />
        <div className={`${TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS} relative ${ttZClass(TT_Z.HERO_SKY)}`}>
          <div className={TT_TRAVELTRUST_PAGE_FRAME_CLASS}>
            <TravelTrustHomeBelowFoldSection onTheaterViewportChange={onTheaterViewportChange} />
          </div>
        </div>
      </main>
    </>
  );
}
