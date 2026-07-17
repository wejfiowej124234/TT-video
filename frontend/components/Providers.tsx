"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { useState } from "react";
import { MetaProvider } from "./MetaProvider";
import { LocaleProvider } from "./LocaleProvider";
import { RoutePrefetcher } from "@/components/navigation/RoutePrefetcher";
import { ViewOnlyAddressProvider } from "@/lib/ViewOnlyAddressContext";
import { getTargetChain } from "@/lib/chainEnv";
import {
  createTravelTrustWagmiConnectors,
  readWalletConnectProjectIdFromEnv,
} from "@/lib/wallet/connection";

const targetChain = getTargetChain();

/**
 * TravelTrust L5 Wallet Connection Center (enterprise · ①).
 * Connectors from shared factory — Web and future App reuse the same set.
 */
const config = createConfig({
  chains: [targetChain],
  multiInjectedProviderDiscovery: true,
  connectors: createTravelTrustWagmiConnectors({
    walletConnectProjectId: readWalletConnectProjectIdFromEnv(),
  }),
  ssr: true,
  transports: {
    [targetChain.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode } ) {
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
