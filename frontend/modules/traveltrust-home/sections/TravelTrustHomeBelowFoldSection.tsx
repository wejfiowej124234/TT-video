"use client";

import { useTraveltrustHomeEntryMilestone } from "@/lib/traveltrust/home/entryBridge";
import { TravelTrustHomeBelowFoldShell } from "@/lib/traveltrust/home/BelowFoldSectionsShell";
import {
  TravelTrustSectionFilmDivider,
  type TheaterViewportAnchor,
} from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustHomeEconomyClusterSection } from "./TravelTrustHomeEconomyClusterSection";
import { TravelTrustHomeRolesSection } from "./TravelTrustHomeRolesSection";
import { TravelTrustHomeStartCloseSection } from "./TravelTrustHomeStartCloseSection";

type Props = {
  onTheaterViewportChange?: (anchor: TheaterViewportAnchor | null) => void;
};

/** 首屏以下叙事节编排（模块边界 · per-section dynamic） */
export function TravelTrustHomeBelowFoldSection({ onTheaterViewportChange }: Props) {
  useTraveltrustHomeEntryMilestone("sections");

  return (
    <TravelTrustHomeBelowFoldShell moduleOrchestrator>
      <TravelTrustHomeEconomyClusterSection />
      <TravelTrustSectionFilmDivider />
      <TravelTrustHomeRolesSection onTheaterViewportChange={onTheaterViewportChange} />
      <TravelTrustSectionFilmDivider />
      <TravelTrustHomeStartCloseSection />
    </TravelTrustHomeBelowFoldShell>
  );
}
