import type { CreateConnectorFn } from "wagmi";
import { coinbaseWallet, injected, metaMask, safe, walletConnect } from "wagmi/connectors";

export type TravelTrustWagmiConnectorOptions = {
  walletConnectProjectId?: string;
  appName?: string;
  appUrl?: string;
  appDescription?: string;
  /** Absolute HTTPS URL to brand mark (TT). Empty → `${appUrl}/brand/bimi-logo.png`. */
  appIconUrl?: string;
};

/** Brand mark path under public/ (HU-029 / HU-030 · Auth L5 TT). */
export const TRAVELTRUST_BRAND_MARK_PATH = "/brand/bimi-logo.png";

export function resolveTravelTrustAppIconUrl(appUrl: string, appIconUrl?: string): string {
  const override = (appIconUrl ?? "").trim();
  if (override.startsWith("https://") || override.startsWith("http://")) {
    return override;
  }
  const base = appUrl.replace(/\/$/, "");
  return `${base}${TRAVELTRUST_BRAND_MARK_PATH}`;
}

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
  const appUrl = options.appUrl ?? "https://traveltrust.app";
  const appDescription =
    options.appDescription ??
    "TravelTrust connects wallets; it never holds your keys or seed phrases.";
  const appIconUrl = resolveTravelTrustAppIconUrl(appUrl, options.appIconUrl);
  const projectId = (options.walletConnectProjectId ?? "").trim();

  const connectors: CreateConnectorFn[] = [
    injected({ shimDisconnect: true }),
    metaMask({
      dappMetadata: {
        name: appName,
        url: appUrl,
        iconUrl: appIconUrl,
      },
    }),
    coinbaseWallet({
      appName,
      appLogoUrl: appIconUrl,
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
          icons: [appIconUrl],
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

/** Prefer deploy site URL so wallet metadata icons resolve on Staging/Production. */
export function readTravelTrustAppUrlFromEnv(
  env: {
    NEXT_PUBLIC_SITE_URL?: string;
    NEXT_PUBLIC_APP_URL?: string;
  } = typeof process !== "undefined" ? process.env : {}
): string {
  const raw = (env.NEXT_PUBLIC_SITE_URL ?? env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol === "http:" || u.protocol === "https:") {
        return u.origin;
      }
    } catch {
      /* fall through */
    }
  }
  return "https://traveltrust.app";
}
