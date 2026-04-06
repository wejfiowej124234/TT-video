"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { useState } from "react";
import { MetaProvider } from "./MetaProvider";
import { LocaleProvider } from "./LocaleProvider";
import { RoutePrefetcher } from "@/components/navigation/RoutePrefetcher";
import { ViewOnlyAddressProvider } from "@/lib/ViewOnlyAddressContext";
import { getTargetChain } from "@/lib/chainEnv";

const targetChain = getTargetChain();

const walletConnectProjectId =
  typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "").trim() : "";

// 默认 injected；若设置 NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID 则追加 WalletConnect（WalletStatusMini 会从 connectors 列表展示）。
// 若遇 auto-reconnect 与某 connector 不兼容，可仅保留 injected 或引入 RainbowKit 等与 wagmi 对齐的封装。
// 目标链由 NEXT_PUBLIC_CHAIN_ID 决定（默认 137 Polygon），与 Escrow / WalletStatusMini / 后端 CHAIN_ID 一致（07 Phase 4、06 §6）。
const config = createConfig({
  chains: [targetChain],
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [
          walletConnect({
            projectId: walletConnectProjectId,
            showQrModal: true,
          }),
        ]
      : []),
  ],
  ssr: true,
  transports: {
    [targetChain.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ViewOnlyAddressProvider>
          <LocaleProvider>
            <MetaProvider>
              <RoutePrefetcher />
              {children}
            </MetaProvider>
          </LocaleProvider>
        </ViewOnlyAddressProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
