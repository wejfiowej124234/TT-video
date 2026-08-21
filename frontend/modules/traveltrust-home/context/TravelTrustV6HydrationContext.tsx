"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  TRAVELTRUST_V6_HYDRATION_INITIAL,
  computeTraveltrustV6HydrationPhase,
  isTraveltrustV6HydrationComplete,
  type TraveltrustV6HydrationPhase,
  type TraveltrustV6HydrationStore,
} from "@/lib/traveltrust/home/v6HydrationStateMachine";

type Ctx = {
  store: TraveltrustV6HydrationStore;
  phase: TraveltrustV6HydrationPhase;
  complete: boolean;
  markRouterReady: () => void;
  markPulseReady: () => void;
  markBriefReady: () => void;
  markScrollLockPending: () => void;
  markScrollLockReady: () => void;
};

const TRAVELTRUST_V6_HYDRATION_NETWORK_INITIAL: TraveltrustV6HydrationStore = {
  ...TRAVELTRUST_V6_HYDRATION_INITIAL,
  /** Provider 仅挂载于 /traveltrust 叙事页 — 无需等待 usePathname */
  routerReady: true,
};

const TravelTrustV6HydrationContext = createContext<Ctx | null>(null);

export function TravelTrustV6HydrationProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<TraveltrustV6HydrationStore>(TRAVELTRUST_V6_HYDRATION_NETWORK_INITIAL);

  const markRouterReady = useCallback(() => {
    setStore((prev) => (prev.routerReady ? prev : { ...prev, routerReady: true }));
  }, []);

  const markPulseReady = useCallback(() => {
    setStore((prev) => (prev.pulseReady ? prev : { ...prev, pulseReady: true }));
  }, []);

  const markBriefReady = useCallback(() => {
    setStore((prev) => (prev.briefReady ? prev : { ...prev, briefReady: true }));
  }, []);

  const markScrollLockPending = useCallback(() => {
    setStore((prev) => (prev.scrollLockReady ? { ...prev, scrollLockReady: false } : prev));
  }, []);

  const markScrollLockReady = useCallback(() => {
    setStore((prev) => (prev.scrollLockReady ? prev : { ...prev, scrollLockReady: true }));
  }, []);

  const phase = computeTraveltrustV6HydrationPhase(store);
  const complete = isTraveltrustV6HydrationComplete(store);

  const value = useMemo(
    () => ({
      store,
      phase,
      complete,
      markRouterReady,
      markPulseReady,
      markBriefReady,
      markScrollLockPending,
      markScrollLockReady,
    }),
    [
      store,
      phase,
      complete,
      markRouterReady,
      markPulseReady,
      markBriefReady,
      markScrollLockPending,
      markScrollLockReady,
    ],
  );

  return (
    <TravelTrustV6HydrationContext.Provider value={value}>{children}</TravelTrustV6HydrationContext.Provider>
  );
}

export function useTraveltrustV6Hydration(): Ctx {
  const ctx = useContext(TravelTrustV6HydrationContext);
  if (!ctx) {
    throw new Error("useTraveltrustV6Hydration must be used within TravelTrustV6HydrationProvider");
  }
  return ctx;
}

/** 非 /traveltrust 树或单测渲染时可缺省 */
export function useTraveltrustV6HydrationOptional(): Ctx | null {
  return useContext(TravelTrustV6HydrationContext);
}
