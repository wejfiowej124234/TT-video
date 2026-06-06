"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";

import { loadTravelTrustSettlementStrip } from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustSettlementStrip = dynamic(loadTravelTrustSettlementStrip, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeSettlementSection() {
  return (
    <TravelTrustHomeSectionSlot sectionId="settlement">
      <TravelTrustSettlementStrip />
    </TravelTrustHomeSectionSlot>
  );
}
