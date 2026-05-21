"use client";

/** @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts` */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

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
