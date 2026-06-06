"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useTraveltrustHomeEntryBridge } from "@/lib/traveltrust/home/entryBridge";

import { loadTravelTrustPageCinematicCanvas } from "@/lib/traveltrust/home/cinematic-bridge";

const TravelTrustPageCinematicCanvas = dynamic(loadTravelTrustPageCinematicCanvas, { ssr: false });

export function TravelTrustHomeWebGLLayer() {
  const { markMilestone } = useTraveltrustHomeEntryBridge();

  useEffect(() => {
    markMilestone("cinematic");
  }, [markMilestone]);

  return <TravelTrustPageCinematicCanvas />;
}
