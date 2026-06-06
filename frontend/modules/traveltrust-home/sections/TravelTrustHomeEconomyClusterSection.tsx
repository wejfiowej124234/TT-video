"use client";

import { TT_PAGE_SECTION_FLOW_L5 } from "@/lib/traveltrust/l5";
import { TravelTrustHomeLiquiditySection } from "./TravelTrustHomeLiquiditySection";
import { TravelTrustHomeSettlementSection } from "./TravelTrustHomeSettlementSection";
import { TravelTrustHomeTrustSection } from "./TravelTrustHomeTrustSection";

export function TravelTrustHomeEconomyClusterSection() {
  return (
    <div
      className={TT_PAGE_SECTION_FLOW_L5.economyClusterClass}
      data-tt-traveltrust-economy-cluster="1"
      data-tt-traveltrust-scroll-chapter-beat="economy"
      data-tt-traveltrust-home-section-cluster="economy"
    >
      <div
        className={TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass}
        aria-hidden
        data-tt-traveltrust-economy-cluster-atmosphere-l5="1"
      />
      <TravelTrustHomeLiquiditySection />
      <TravelTrustHomeTrustSection />
      <TravelTrustHomeSettlementSection />
    </div>
  );
}
