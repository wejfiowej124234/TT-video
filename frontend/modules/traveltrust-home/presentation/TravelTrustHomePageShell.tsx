"use client";

import type { ReactNode } from "react";
import { HomeEntryGateProvider, useHomeEntryGate } from "../context/HomeEntryGateContext";
import { TravelTrustHomeEntryOverlay } from "./TravelTrustHomeEntryOverlay";

function HomeEntryGateOverlayHost() {
  const { gateOpen, progress, activeMilestone } = useHomeEntryGate();
  return (
    <TravelTrustHomeEntryOverlay
      visible={gateOpen}
      progress={progress}
      activeMilestone={activeMilestone}
      variant="gate"
    />
  );
}

/**
 * 首页应用壳（企业入口层）
 * - core：里程碑 / 预取 / 常量
 * - context：入口闸状态
 * - presentation：读条遮罩 + 子页面
 */
export function TravelTrustHomePageShell({ children }: { children: ReactNode }) {
  return (
    <HomeEntryGateProvider>
      <HomeEntryGateOverlayHost />
      <div data-tt-traveltrust-home-page-shell="1">{children}</div>
    </HomeEntryGateProvider>
  );
}
