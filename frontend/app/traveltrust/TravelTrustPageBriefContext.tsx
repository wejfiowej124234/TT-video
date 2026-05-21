"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TravelTrustPageBrief, TravelTrustPageBriefSource } from "@/lib/traveltrustPageBrief";
import { useTravelTrustPageBrief } from "./useTravelTrustPageBrief";

type Ctx = {
  brief: TravelTrustPageBrief | null;
  error: string | null;
  ready: boolean;
  degraded: boolean;
  source: TravelTrustPageBriefSource | null;
};

const TravelTrustPageBriefContext = createContext<Ctx>({
  brief: null,
  error: null,
  ready: false,
  degraded: false,
  source: null,
});

export function TravelTrustPageBriefProvider({ children }: { children: ReactNode }) {
  const state = useTravelTrustPageBrief();
  return (
    <TravelTrustPageBriefContext.Provider value={state}>
      <div className="relative">{children}</div>
    </TravelTrustPageBriefContext.Provider>
  );
}

export function useTravelTrustPageBriefContext() {
  return useContext(TravelTrustPageBriefContext);
}
