"use client";

import dynamic from "next/dynamic";
import {
  TravelTrustSnapChapter,
  loadTravelTrustIdentityTheater,
  type TheaterViewportAnchor,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { BelowFoldSectionPlaceholder } from "./BelowFoldSectionPlaceholder";
import { TravelTrustHomeSectionSlot } from "./ui";

const TravelTrustIdentityTheater = dynamic(loadTravelTrustIdentityTheater, {
  ssr: true,
  loading: () => <BelowFoldSectionPlaceholder tall />,
});

type Props = {
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

export function TravelTrustHomeRolesSection({ onTheaterViewportChange }: Props) {
  return (
    <TravelTrustSnapChapter chapterId="theater" align="center">
      <TravelTrustHomeSectionSlot sectionId="roles">
        <TravelTrustIdentityTheater onViewportChange={onTheaterViewportChange} />
      </TravelTrustHomeSectionSlot>
    </TravelTrustSnapChapter>
  );
}
