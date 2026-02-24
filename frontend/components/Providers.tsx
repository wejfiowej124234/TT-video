"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { walletConnect } from "@wagmi/connectors";
import { useState } from "react";

// WalletConnect v2：在 cloud.walletconnect.com 创建项目后设置 NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
