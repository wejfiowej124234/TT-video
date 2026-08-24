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
  readTravelTrustAppUrlFromEnv,
  readWalletConnectProjectIdFromEnv,
} from "@/lib/wallet/connection";

const targetChain = getTargetChain();
/** Prefer live origin so WalletConnect metadata.url matches Staging/Official host (F8). */
const appUrl =
  typeof window !== "undefined" ? window.location.origin : readTravelTrustAppUrlFromEnv();

/**
 * TravelTrust L5 Wallet Connection Center (enterprise · ①).
 * Connectors from shared factory — Web and future App reuse the same set.
 */
const config = createConfig({
  chains: [targetChain],
  multiInjectedProviderDiscovery: true,
  connectors: createTravelTrustWagmiConnectors({
    walletConnectProjectId: readWalletConnectProjectIdFromEnv(),
    appName: "TravelTrust",
    appUrl,
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
