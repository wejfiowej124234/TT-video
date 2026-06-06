"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";

type TheaterRoleCtx = {
  roleId: TravelTrustRoleId;
  setRoleId: (id: TravelTrustRoleId) => void;
};

const TravelTrustTheaterRoleContext = createContext<TheaterRoleCtx | null>(null);

export function TravelTrustTheaterRoleProvider({ children }: { children: ReactNode }) {
  const [roleId, setRoleIdState] = useState<TravelTrustRoleId>("traveler");
  const setRoleId = useCallback((id: TravelTrustRoleId) => setRoleIdState(id), []);
  const value = useMemo(() => ({ roleId, setRoleId }), [roleId, setRoleId]);
  return (
    <TravelTrustTheaterRoleContext.Provider value={value}>{children}</TravelTrustTheaterRoleContext.Provider>
  );
}

export function useTravelTrustTheaterRole(): TheaterRoleCtx {
  const ctx = useContext(TravelTrustTheaterRoleContext);
  if (!ctx) {
    return {
      roleId: "traveler",
      setRoleId: () => {},
    };
  }
  return ctx;
}
