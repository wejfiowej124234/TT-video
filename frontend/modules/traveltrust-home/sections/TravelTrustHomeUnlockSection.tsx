"use client";

import dynamic from "next/dynamic";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";
import { loadTravelTrustTtgUnlockSchedule } from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustTtgUnlockSchedule = dynamic(loadTravelTrustTtgUnlockSchedule, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeUnlockSection() {
  return (
    <TravelTrustHomeSectionSlot sectionId="unlock">
      <TravelTrustTtgUnlockSchedule />
    </TravelTrustHomeSectionSlot>
  );
}
