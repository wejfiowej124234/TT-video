"use client";

import type { ReactNode } from "react";
import {
  TRAVELTRUST_HOME_SECTION_IDS,
  traveltrustHomeSectionMarker,
} from "@/lib/traveltrust/home/sectionMarkers";

type SectionId = Exclude<(typeof TRAVELTRUST_HOME_SECTION_IDS)[number], "hero">;

type Props = {
  sectionId: SectionId;
  children: ReactNode;
  className?: string;
};

/** 首页 module 节边界槽位（P3 · UI 归属 module 的 DOM 壳） */
export function TravelTrustHomeSectionSlot({ sectionId, children, className }: Props) {
  return (
    <div {...traveltrustHomeSectionMarker(sectionId)} className={className}>
      {children}
    </div>
  );
}
