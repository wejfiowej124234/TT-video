"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";

import { loadTravelTrustStablecoinGateway } from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustStablecoinGateway = dynamic(loadTravelTrustStablecoinGateway, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeLiquiditySection() {
  return (
    <TravelTrustHomeSectionSlot sectionId="liquidity">
      <TravelTrustStablecoinGateway />
    </TravelTrustHomeSectionSlot>
  );
}
