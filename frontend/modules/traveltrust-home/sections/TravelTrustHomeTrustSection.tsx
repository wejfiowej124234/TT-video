"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";

import { loadTravelTrustTrustFactsStrip } from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustTrustFactsStrip = dynamic(loadTravelTrustTrustFactsStrip, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeTrustSection() {
  return (
    <TravelTrustHomeSectionSlot sectionId="trust">
      <TravelTrustTrustFactsStrip />
    </TravelTrustHomeSectionSlot>
  );
}
