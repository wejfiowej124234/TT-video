"use client";

import type { ReactNode } from "react";
import { TT_ANNOUNCEMENTS_PAGE_L5 } from "@/lib/traveltrust/l5";
import { TravelTrustAnnouncementsPageAtmosphere } from "./TravelTrustAnnouncementsPageAtmosphere";
import { TravelTrustCinematicViewportInk } from "./TravelTrustCinematicViewportInk";

type Props = {
  children: ReactNode;
};

/** 公告归档页 L5 壳：底光 + 超宽护板 + 与长页一致的内容轨 */
export function TravelTrustAnnouncementsPageShell({ children }: Props) {
  return (
    <div
      className={TT_ANNOUNCEMENTS_PAGE_L5.rootClass}
      data-tt-traveltrust-announcements-shell="1"
      data-tt-traveltrust-announcements-shell-l5="1"
    >
      <TravelTrustAnnouncementsPageAtmosphere />
      <TravelTrustCinematicViewportInk />
      <div className={TT_ANNOUNCEMENTS_PAGE_L5.sectionClass}>
        <div className={TT_ANNOUNCEMENTS_PAGE_L5.contentBodyClass}>{children}</div>
      </div>
    </div>
  );
}
