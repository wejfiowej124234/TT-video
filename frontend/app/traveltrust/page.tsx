"use client";

import { TravelTrustHomePageShell } from "@/modules/traveltrust-home";
import { TravelTrustNetworkPageMain } from "./TravelTrustNetworkPageMain";

export default function TravelTrustNetworkPage() {
  return (
    <TravelTrustHomePageShell>
      <TravelTrustNetworkPageMain />
    </TravelTrustHomePageShell>
  );
}
