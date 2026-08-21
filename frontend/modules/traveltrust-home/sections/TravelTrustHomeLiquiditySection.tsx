"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";

import { loadTravelTrustStablecoinGateway } from "@/lib/traveltrust/home/cinematic-bridge";
import { TRAVELTRUST_HOME_LAYOUT_LOCK_L5 } from "@/lib/traveltrustHomeLayoutLockL5";
import {
  TravelTrustHomeLiquidityFacts,
  TravelTrustHomeLiquidityPriceRail,
} from "./TravelTrustHomeLiquidityFacts";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustStablecoinGateway = dynamic(loadTravelTrustStablecoinGateway, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeLiquiditySection() {
  return (
    <TravelTrustHomeSectionSlot sectionId="liquidity">
      <div className={TRAVELTRUST_HOME_LAYOUT_LOCK_L5.liquiditySplit.stack}>
        <TravelTrustHomeLiquidityPriceRail />
        <div
          className={TRAVELTRUST_HOME_LAYOUT_LOCK_L5.liquiditySplit.wrap}
          data-tt-traveltrust-liquidity-split="1"
        >
          <TravelTrustHomeLiquidityFacts />
          <TravelTrustStablecoinGateway />
        </div>
      </div>
    </TravelTrustHomeSectionSlot>
  );
}
