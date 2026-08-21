"use client";

import dynamic from "next/dynamic";
import { TravelTrustSnapChapter, loadTravelTrustFaqStrip } from "@/lib/traveltrust/home/cinematic-bridge";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustFaqStrip = dynamic(loadTravelTrustFaqStrip, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeFaqSection() {
  return (
    <TravelTrustSnapChapter chapterId="faq" align="start">
      <TravelTrustHomeSectionSlot sectionId="faq">
        <TravelTrustFaqStrip />
      </TravelTrustHomeSectionSlot>
    </TravelTrustSnapChapter>
  );
}
