"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { useTraveltrustHomeEntryMilestone } from "@/lib/traveltrust/home/entryBridge";
import { TT_HERO_CONTENT_SHELL_CLASS } from "@/lib/traveltrustHeroLayout";
import { loadTravelTrustCinematicHero } from "@/lib/traveltrust/home/cinematic-bridge";

const TravelTrustCinematicHero = dynamic(loadTravelTrustCinematicHero, {
  ssr: true,
  loading: () => (
    <section
      id="hero"
      className={TT_HERO_CONTENT_SHELL_CLASS}
      aria-hidden
      data-tt-traveltrust-hero-placeholder="1"
    />
  ),
});

type Props = {
  heroRef?: RefObject<HTMLElement | null>;
};

export function TravelTrustHomeHeroSection({ heroRef }: Props) {
  useTraveltrustHomeEntryMilestone("hero");
  return (
    <div className="contents" data-tt-home-module="M04">
      <TravelTrustCinematicHero heroRef={heroRef} />
    </div>
  );
}
