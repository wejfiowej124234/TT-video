"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import type { TraveltrustHomeEntryMilestoneId } from "./milestones";

export type TraveltrustHomeEntryBridge = {
  markMilestone: (id: TraveltrustHomeEntryMilestoneId) => void;
};

const noopBridge: TraveltrustHomeEntryBridge = {
  markMilestone: () => undefined,
};

const HomeEntryBridgeContext = createContext<TraveltrustHomeEntryBridge>(noopBridge);

export function HomeEntryBridgeProvider({
  value,
  children,
}: {
  value: TraveltrustHomeEntryBridge;
  children: ReactNode;
}) {
  return <HomeEntryBridgeContext.Provider value={value}>{children}</HomeEntryBridgeContext.Provider>;
}

export function useTraveltrustHomeEntryBridge(): TraveltrustHomeEntryBridge {
  return useContext(HomeEntryBridgeContext);
}

/** cinematic / section 子树上报里程碑（不依赖 modules/traveltrust-home） */
export function useTraveltrustHomeEntryMilestone(
  id: TraveltrustHomeEntryMilestoneId,
  active = true,
): void {
  const { markMilestone } = useTraveltrustHomeEntryBridge();
  useEffect(() => {
    if (!active) return;
    markMilestone(id);
  }, [active, id, markMilestone]);
}
