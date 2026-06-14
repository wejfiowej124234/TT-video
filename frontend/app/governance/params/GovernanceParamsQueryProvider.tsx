"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

type GovernanceParamsQueryContextValue = {
  fromStewardWorkbench: boolean;
};

const GovernanceParamsQueryContext = createContext<GovernanceParamsQueryContextValue>({
  fromStewardWorkbench: false,
});

export function GovernanceParamsQueryProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const fromStewardWorkbench = searchParams.get("from") === "steward_workbench";
  return (
    <GovernanceParamsQueryContext.Provider value={{ fromStewardWorkbench }}>
      {children}
    </GovernanceParamsQueryContext.Provider>
  );
}

export function useGovernanceParamsQuery() {
  return useContext(GovernanceParamsQueryContext);
}
