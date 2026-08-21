"use client";

import dynamic from "next/dynamic";
import {
  TravelTrustSnapChapter,
  loadTravelTrustNetworkFooter,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { TT_SNAP_CHAPTER_GROUP_L5 } from "@/lib/traveltrust/l5";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustNetworkFooter = dynamic(loadTravelTrustNetworkFooter, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder />,
});

/** M11 Start / CTA · 截图无「先了解 TTG 再规划」三步；仅保留 #start 锚点 + grouped footer */
export function TravelTrustHomeStartCloseSection() {
  return (
    <TravelTrustSnapChapter chapterId="close" align="start">
      <div
        className={TT_SNAP_CHAPTER_GROUP_L5.innerStackClass}
        data-tt-traveltrust-home-section-group="close"
        data-tt-home-module="M11"
        id="start"
      >
        <TravelTrustHomeSectionSlot sectionId="start">
          <TravelTrustNetworkFooter grouped />
        </TravelTrustHomeSectionSlot>
      </div>
    </TravelTrustSnapChapter>
  );
}
