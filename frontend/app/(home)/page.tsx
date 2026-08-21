"use client";

import { TravelTrustHomePageShell } from "@/modules/traveltrust-home";
import { TravelTrustNetworkPageMain } from "@/app/traveltrust/TravelTrustNetworkPageMain";

/** Official apex `/` · cinematic network home (same surface as `/traveltrust`) */
export default function Home() {
  return (
    <TravelTrustHomePageShell>
      <TravelTrustNetworkPageMain />
    </TravelTrustHomePageShell>
  );
}
