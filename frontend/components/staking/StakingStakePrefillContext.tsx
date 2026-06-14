"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type StakingStakePrefillValue = {
  prefillAmount: string | null;
  requestPrefill: (amount: string) => void;
  clearPrefill: () => void;
};

const StakingStakePrefillContext = createContext<StakingStakePrefillValue>({
  prefillAmount: null,
  requestPrefill: () => {},
  clearPrefill: () => {},
});

export function StakingStakePrefillProvider({ children }: { children: ReactNode }) {
  const [prefillAmount, setPrefillAmount] = useState<string | null>(null);
  const requestPrefill = useCallback((amount: string) => {
    setPrefillAmount(amount.trim());
  }, []);
  const clearPrefill = useCallback(() => setPrefillAmount(null), []);
  const value = useMemo(
    () => ({ prefillAmount, requestPrefill, clearPrefill }),
    [prefillAmount, requestPrefill, clearPrefill],
  );
  return (
    <StakingStakePrefillContext.Provider value={value}>{children}</StakingStakePrefillContext.Provider>
  );
}

export function useStakingStakePrefill(): StakingStakePrefillValue {
  return useContext(StakingStakePrefillContext);
}
