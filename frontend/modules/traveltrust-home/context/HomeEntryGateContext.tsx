"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HomeEntryBridgeProvider } from "@/lib/traveltrust/home/entryBridge";
import { TRAVELTRUST_HOME_ENTRY_GATE_L5 } from "../core/constants";
import {
  computeTraveltrustHomeEntryProgress,
  isTraveltrustHomeEntryComplete,
  type TraveltrustHomeEntryMilestoneId,
} from "../core/milestones";
import {
  markTraveltrustHomeEntryGateDone,
  runTraveltrustHomeCriticalPrefetch,
  scheduleTraveltrustHomeDeferredPrefetch,
  shouldSkipTraveltrustHomeEntryGate,
} from "../core/prefetch";

type GateCtx = {
  gateOpen: boolean;
  progress: number;
  activeMilestone: TraveltrustHomeEntryMilestoneId | null;
  markMilestone: (id: TraveltrustHomeEntryMilestoneId) => void;
};

const HomeEntryGateContext = createContext<GateCtx | null>(null);

function resolveActiveMilestone(done: ReadonlySet<TraveltrustHomeEntryMilestoneId>): TraveltrustHomeEntryMilestoneId | null {
  for (const id of ["sections", "hero", "cinematic", "brief", "shell"] as const) {
    if (!done.has(id)) return id;
  }
  return null;
}

export function HomeEntryGateProvider({ children }: { children: ReactNode }) {
  /** SSR 与首帧客户端同为 false，避免「先露出 L1 公告再被入口闸盖住」的闪灭 */
  const [gateOpen, setGateOpen] = useState(false);
  const [progress, setProgress] = useState(8);
  const doneRef = useRef(new Set<TraveltrustHomeEntryMilestoneId>());
  const openedAtRef = useRef(0);
  const closedRef = useRef(false);

  const syncProgress = useCallback(() => {
    const done = doneRef.current;
    setProgress(computeTraveltrustHomeEntryProgress(done));
  }, []);

  const markMilestone = useCallback(
    (id: TraveltrustHomeEntryMilestoneId) => {
      if (closedRef.current || doneRef.current.has(id)) return;
      doneRef.current.add(id);
      syncProgress();
    },
    [syncProgress],
  );

  const tryClose = useCallback(() => {
    if (closedRef.current) return;
    const done = doneRef.current;
    if (!isTraveltrustHomeEntryComplete(done)) return;
    const elapsed = performance.now() - openedAtRef.current;
    if (elapsed < TRAVELTRUST_HOME_ENTRY_GATE_L5.minVisibleMs) {
      const wait = TRAVELTRUST_HOME_ENTRY_GATE_L5.minVisibleMs - elapsed;
      globalThis.setTimeout(() => {
        if (!isTraveltrustHomeEntryComplete(doneRef.current)) return;
        closedRef.current = true;
        setProgress(100);
        setGateOpen(false);
        markTraveltrustHomeEntryGateDone();
      }, wait);
      return;
    }
    closedRef.current = true;
    setProgress(100);
    setGateOpen(false);
    markTraveltrustHomeEntryGateDone();
  }, []);

  useEffect(() => {
    const skip = shouldSkipTraveltrustHomeEntryGate();
    runTraveltrustHomeCriticalPrefetch();
    markMilestone("shell");
    const cancelDeferred = scheduleTraveltrustHomeDeferredPrefetch(() => markMilestone("sections"));
    const briefFallback = globalThis.setTimeout(
      () => markMilestone("brief"),
      TRAVELTRUST_HOME_ENTRY_GATE_L5.briefFallbackMs,
    );
    const maxWait = globalThis.setTimeout(() => {
      for (const id of ["brief", "cinematic", "hero", "sections"] as const) {
        markMilestone(id);
      }
      closedRef.current = true;
      setProgress(100);
      setGateOpen(false);
      markTraveltrustHomeEntryGateDone();
    }, TRAVELTRUST_HOME_ENTRY_GATE_L5.maxWaitMs);
    if (skip) {
      closedRef.current = true;
      setProgress(100);
      setGateOpen(false);
      return () => {
        cancelDeferred();
        globalThis.clearTimeout(briefFallback);
        globalThis.clearTimeout(maxWait);
      };
    }
    /** 仅后台预取 + 里程碑；不打开全屏遮罩，避免盖住 L1 公告（z 与 #main-content 叠层） */
    return () => {
      cancelDeferred();
      globalThis.clearTimeout(briefFallback);
      globalThis.clearTimeout(maxWait);
    };
  }, [markMilestone]);

  useEffect(() => {
    if (!gateOpen) return;
    if (isTraveltrustHomeEntryComplete(doneRef.current)) tryClose();
  }, [gateOpen, progress, tryClose]);

  const activeMilestone = gateOpen ? resolveActiveMilestone(doneRef.current) : null;

  const value = useMemo(
    () => ({ gateOpen, progress, activeMilestone, markMilestone }),
    [gateOpen, progress, activeMilestone, markMilestone],
  );

  return (
    <HomeEntryGateContext.Provider value={value}>
      <HomeEntryBridgeProvider value={{ markMilestone }}>{children}</HomeEntryBridgeProvider>
    </HomeEntryGateContext.Provider>
  );
}

export function useHomeEntryGate(): GateCtx {
  const ctx = useContext(HomeEntryGateContext);
  if (!ctx) {
    return {
      gateOpen: false,
      progress: 100,
      activeMilestone: null,
      markMilestone: () => undefined,
    };
  }
  return ctx;
}
