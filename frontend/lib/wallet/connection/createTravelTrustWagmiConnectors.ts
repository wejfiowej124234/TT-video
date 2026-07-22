import type { CreateConnectorFn } from "wagmi";
import { coinbaseWallet, injected, metaMask, safe, walletConnect } from "wagmi/connectors";

export type TravelTrustWagmiConnectorOptions = {
  walletConnectProjectId?: string;
  appName?: string;
  appUrl?: string;
  appDescription?: string;
};

/**
 * Canonical wagmi connector set for TravelTrust L5 Wallet Connection Center.
 * Used by Web `Providers` today; App may import the same factory (or a RN-safe fork).
 *
 * Included: EIP-6963 discovery (injected) · MetaMask · Coinbase · WalletConnect · Safe
 * Excluded: embedded / social / hosted wallets
 */
export function createTravelTrustWagmiConnectors(
  options: TravelTrustWagmiConnectorOptions = {}
): CreateConnectorFn[] {
  const appName = options.appName ?? "TravelTrust";
  const appUrl = options.appUrl ?? "https://traveltrust.io";
  const appDescription =
    options.appDescription ??
    "TravelTrust connects wallets; it never holds your keys or seed phrases.";
  const projectId = (options.walletConnectProjectId ?? "").trim();

  const connectors: CreateConnectorFn[] = [
    injected({ shimDisconnect: true }),
    metaMask({ dappMetadata: { name: appName, url: appUrl } }),
    coinbaseWallet({
      appName,
      preference: "all",
    }),
  ];

  if (projectId) {
    connectors.push(
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: appName,
          description: appDescription,
          url: appUrl,
          icons: [],
        },
      })
    );
  }

  connectors.push(
    safe({
      allowedDomains: [/./],
      debug: false,
    })
  );

  return connectors;
}

export function readWalletConnectProjectIdFromEnv(
  env: { NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?: string } = typeof process !== "undefined"
    ? process.env
    : {}
): string {
  return (env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "").trim();
}
