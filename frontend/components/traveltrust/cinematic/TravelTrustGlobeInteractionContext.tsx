"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { registerGlobeCanvasHoverProbeClear } from "@/lib/traveltrustHeroGlobeE2eProbe";

type TravelTrustGlobeInteractionContextValue = {
  hoveredRegionId: string | null;
  setHoveredRegionId: (id: string | null) => void;
  interactive: boolean;
};

const TravelTrustGlobeInteractionContext = createContext<TravelTrustGlobeInteractionContextValue | null>(
  null,
);

export function TravelTrustGlobeInteractionProvider({
  interactive,
  children,
}: {
  interactive: boolean;
  children: ReactNode;
}) {
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_TRAVELTRUST_E2E_PROBE !== "1" &&
      process.env.NODE_ENV !== "development"
    ) {
      return;
    }
    registerGlobeCanvasHoverProbeClear(() => setHoveredRegionId(null));
    return () => registerGlobeCanvasHoverProbeClear(null);
  }, []);
  const value = useMemo(
    () => ({ hoveredRegionId, setHoveredRegionId, interactive }),
    [hoveredRegionId, interactive],
  );
  return (
    <TravelTrustGlobeInteractionContext.Provider value={value}>
      {children}
    </TravelTrustGlobeInteractionContext.Provider>
  );
}

export function useTravelTrustGlobeInteraction(): TravelTrustGlobeInteractionContextValue {
  const ctx = useContext(TravelTrustGlobeInteractionContext);
  if (!ctx) {
    return {
      hoveredRegionId: null,
      setHoveredRegionId: () => {},
      interactive: false,
    };
  }
  return ctx;
}
