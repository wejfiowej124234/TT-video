"use client";

import type { ReactNode } from "react";
import { TravelTrustCinematicShell } from "@/lib/traveltrust/home/cinematic-bridge";
import { TravelTrustPageBriefStatus } from "@/components/traveltrust/TravelTrustPageBriefStatus";
import { TravelTrustHomeComposerOverlays } from "./TravelTrustHomeComposerOverlays";

type Props = {
  domOutlineDebug: boolean;
  domCompositorAudit: boolean;
  children: ReactNode;
};

/** 电影壳 + brief 状态 + 全局叠层 */
export function TravelTrustHomeComposerShell({ domOutlineDebug, domCompositorAudit, children }: Props) {
  return (
    <TravelTrustCinematicShell>
      <TravelTrustPageBriefStatus />
      <TravelTrustHomeComposerOverlays
        domOutlineDebug={domOutlineDebug}
        domCompositorAudit={domCompositorAudit}
      />
      {children}
    </TravelTrustCinematicShell>
  );
}
