"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAccount } from "wagmi";

type StakingWalletGateValue = {
  isConnected: boolean;
  /** 页顶已展示钱包 CTA 时，子面板不再重复「请先在上方连接」 */
  pageLevelConnectPrompt: boolean;
};

const StakingWalletGateContext = createContext<StakingWalletGateValue>({
  isConnected: false,
  pageLevelConnectPrompt: false,
});

export function StakingWalletGateProvider({
  pageLevelConnectPrompt,
  children,
}: {
  pageLevelConnectPrompt: boolean;
  children: ReactNode;
}) {
  const { isConnected } = useAccount();
  return (
    <StakingWalletGateContext.Provider value={{ isConnected, pageLevelConnectPrompt }}>
      {children}
    </StakingWalletGateContext.Provider>
  );
}

export function useStakingWalletGate(): StakingWalletGateValue {
  return useContext(StakingWalletGateContext);
}

/** 页顶已有连接提示且未连钱包 → 子面板用禁用态，不再刷屏 */
export function useSuppressStakingConnectHint(): boolean {
  const { isConnected, pageLevelConnectPrompt } = useStakingWalletGate();
  return pageLevelConnectPrompt && !isConnected;
}
