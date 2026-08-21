"use client";

import type { MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import {
  TravelTrustHeroScrollContext,
  TravelTrustPageScrollContext,
  TravelTrustTheaterRoleProvider,
  TravelTrustTheaterViewportContext,
  type TheaterViewportAnchor,
} from "@/lib/traveltrust/home/cinematic-bridge";

type Props = {
  heroScroll: MotionValue<number>;
  pageScroll: MotionValue<number>;
  theaterViewport: TheaterViewportAnchor | null;
  children: ReactNode;
};

export function TravelTrustHomeScrollProviders({
  heroScroll,
  pageScroll,
  theaterViewport,
  children,
}: Props) {
  return (
    <TravelTrustTheaterRoleProvider>
      <TravelTrustHeroScrollContext.Provider value={heroScroll}>
        <TravelTrustPageScrollContext.Provider value={pageScroll}>
          <TravelTrustTheaterViewportContext.Provider value={theaterViewport}>
            {children}
          </TravelTrustTheaterViewportContext.Provider>
        </TravelTrustPageScrollContext.Provider>
      </TravelTrustHeroScrollContext.Provider>
    </TravelTrustTheaterRoleProvider>
  );
}
