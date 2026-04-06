"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/** 54-S17：只读钱包地址（无签名、仅展示该地址视角）；用于「输入钱包地址」入口 */
const ViewOnlyAddressContext = createContext<{
  viewOnlyAddress: string | null;
  setViewOnlyAddress: (v: string | null) => void;
} | null>(null);

export function ViewOnlyAddressProvider({ children }: { children: ReactNode }) {
  const [viewOnlyAddress, setViewOnlyAddress] = useState<string | null>(null);
  return (
    <ViewOnlyAddressContext.Provider value={{ viewOnlyAddress, setViewOnlyAddress }}>
      {children}
    </ViewOnlyAddressContext.Provider>
  );
}

export function useViewOnlyAddress() {
  const ctx = useContext(ViewOnlyAddressContext);
  return ctx ?? { viewOnlyAddress: null, setViewOnlyAddress: () => {} };
}
