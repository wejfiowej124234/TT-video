"use client";

import dynamic from "next/dynamic";
import {
  TravelTrustSnapChapter,
  loadTravelTrustNetworkFooter,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { TT_SNAP_CHAPTER_GROUP_L5 } from "@/lib/traveltrust/l5";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";

const TravelTrustNetworkFooter = dynamic(loadTravelTrustNetworkFooter, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

export function TravelTrustHomeStartCloseSection() {
  return (
    <TravelTrustSnapChapter chapterId="close" align="start">
      <div className={TT_SNAP_CHAPTER_GROUP_L5.innerStackClass} data-tt-traveltrust-home-section-group="close">
        <TravelTrustNetworkFooter grouped />
      </div>
    </TravelTrustSnapChapter>
  );
}
