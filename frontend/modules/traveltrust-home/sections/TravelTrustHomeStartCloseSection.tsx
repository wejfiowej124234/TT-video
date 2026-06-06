"use client";

import dynamic from "next/dynamic";
import {
  TravelTrustSnapChapter,
  loadTravelTrustNetworkFooter,
  loadTravelTrustStartSection,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { TT_SNAP_CHAPTER_GROUP_L5 } from "@/lib/traveltrust/l5";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustStartSection = dynamic(loadTravelTrustStartSection, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

const TravelTrustNetworkFooter = dynamic(loadTravelTrustNetworkFooter, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeStartCloseSection() {
  return (
    <TravelTrustSnapChapter chapterId="close" align="start">
      <div className={TT_SNAP_CHAPTER_GROUP_L5.innerStackClass} data-tt-traveltrust-home-section-group="close">
        <TravelTrustHomeSectionSlot sectionId="start">
          <TravelTrustStartSection />
        </TravelTrustHomeSectionSlot>
        <TravelTrustNetworkFooter grouped />
      </div>
    </TravelTrustSnapChapter>
  );
}
