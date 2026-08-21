"use client";

import type { RefObject } from "react";
import type { TheaterViewportAnchor } from "@/lib/traveltrust/home/cinematic-bridge";
import {
  TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS,
  TT_TRAVELTRUST_PAGE_FRAME_CLASS,
} from "@/lib/traveltrustPageLayout";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";
import { TravelTrustHomeBelowFoldSection } from "../sections/TravelTrustHomeBelowFoldSection";
import { TravelTrustHomeHeroSection } from "../sections/TravelTrustHomeHeroSection";

type Props = {
  heroRef: RefObject<HTMLElement | null>;
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

/**
 * HOME_BODY_MODULE：M04–M11 screenshot body only.
 * Backdrop + Landing chrome mount in TravelTrustHomeMainColumn (Official pin order).
 */
export function TravelTrustHomeBodyModule({ heroRef, onTheaterViewportChange }: Props) {
  return (
    <div className="contents" data-tt-home-body-module="1" data-tt-home-modules="M04-M11">
      <TravelTrustHomeHeroSection heroRef={heroRef} />
      <div className={`${TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS} relative ${ttZClass(TT_Z.HERO_SKY)}`}>
        <div className={TT_TRAVELTRUST_PAGE_FRAME_CLASS}>
          <TravelTrustHomeBelowFoldSection onTheaterViewportChange={onTheaterViewportChange} />
        </div>
      </div>
    </div>
  );
}
