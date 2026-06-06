"use client";

import {
  TravelTrustCinematicA11y,
  TravelTrustDevChunkRecoveryNotice,
  TravelTrustReducedMotionNotice,
} from "@/lib/traveltrust/home/cinematic-bridge";
import {
  TravelTrustHomeDomCompositorAudit,
  TravelTrustHomeDomLayoutDebug,
  TravelTrustHomePageScrollBoot,
  TravelTrustHomeScrollProgress,
  TravelTrustHomeSectionSpacingDebug,
} from "./TravelTrustHomeComposerDynamics";

type Props = {
  domOutlineDebug: boolean;
  domCompositorAudit: boolean;
};

/** Shell 内全局叠层（读条 / a11y / 滚轮 boot · 非节内容） */
export function TravelTrustHomeComposerOverlays({ domOutlineDebug, domCompositorAudit }: Props) {
  return (
    <>
      <TravelTrustDevChunkRecoveryNotice />
      <TravelTrustCinematicA11y />
      <TravelTrustReducedMotionNotice />
      <TravelTrustHomeScrollProgress />
      <TravelTrustHomeSectionSpacingDebug />
      {domOutlineDebug ? <TravelTrustHomeDomLayoutDebug /> : null}
      {domCompositorAudit ? <TravelTrustHomeDomCompositorAudit /> : null}
      <TravelTrustHomePageScrollBoot />
    </>
  );
}
