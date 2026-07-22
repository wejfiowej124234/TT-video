import type { Connector } from "wagmi";

/** Recommended brand order for TravelTrust L5 Wallet Sheet (RC). */
export const WALLET_RECOMMENDED_ORDER = [
  "metamask",
  "rabby",
  "okx",
  "bitget",
  "coinbase",
  "trust",
] as const;

/** Install / download help per brand (fallback = ethereum.org wallets). */
export const WALLET_INSTALL_URL: Record<string, string> = {
  metamask: "https://metamask.io/download/",
  rabby: "https://rabby.io/",
  okx: "https://www.okx.com/download",
  bitget: "https://web3.bitget.com/ww/wallet-download",
  coinbase: "https://www.coinbase.com/wallet/downloads",
  trust: "https://trustwallet.com/download",
};

export type WalletConnectorKind =
  | "recommended"
  | "walletConnect"
  | "injectedOther"
  | "safe"
  | "other";

export type CataloguedConnector = {
  connector: Connector;
  kind: WalletConnectorKind;
  /** Stable match key for i18n / badges */
  brandKey: string;
  installed: boolean;
};

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function connectorBrandKey(connector: Connector): string {
  const id = norm(connector.id ?? "");
  const name = norm(connector.name ?? "");
  const rdns = norm(String((connector as { rdns?: string }).rdns ?? ""));
  const hay = `${id} ${name} ${rdns}`;
  if (hay.includes("walletconnect") || id === "walletConnect") return "walletconnect";
  if (hay.includes("safe") || id === "safe") return "safe";
  if (hay.includes("metamask") || rdns.includes("io.metamask")) return "metamask";
  if (hay.includes("rabby") || rdns.includes("io.rabby")) return "rabby";
  if (hay.includes("okx") || rdns.includes("com.okex")) return "okx";
  if (
    hay.includes("bitget") ||
    hay.includes("bitkeep") ||
    rdns.includes("com.bitget") ||
    rdns.includes("io.bitget")
  ) {
    return "bitget";
  }
  if (hay.includes("coinbase") || rdns.includes("com.coinbase")) return "coinbase";
  if (hay.includes("trust") || rdns.includes("com.trustwallet")) return "trust";
  if (id === "injected" || name === "injected") return "injected";
  return id || name || "unknown";
}

export function classifyConnector(connector: Connector): WalletConnectorKind {
  const key = connectorBrandKey(connector);
  if (key === "walletconnect") return "walletConnect";
  if (key === "safe") return "safe";
  if ((WALLET_RECOMMENDED_ORDER as readonly string[]).includes(key)) return "recommended";
  if (connector.type === "injected" || key === "injected") return "injectedOther";
  return "other";
}

/** EIP-6963 / provider presence heuristic for “已安装” badge. */
export function isConnectorInstalled(connector: Connector): boolean {
  if (typeof window === "undefined") return false;
  const key = connectorBrandKey(connector);
  if (key === "walletconnect") return true;
  if (key === "safe") return isLikelySafeApp();
  try {
    const w = window as Window & {
      ethereum?: { providers?: unknown[]; isMetaMask?: boolean };
      bitkeep?: { ethereum?: unknown };
      bitget?: { ethereum?: unknown };
    };
    if (key === "bitget" && (w.bitkeep?.ethereum || w.bitget?.ethereum)) return true;
    const eth = w.ethereum;
    if (!eth) return connector.type === "injected" && Boolean(connector.icon);
    if (key === "metamask" && eth.isMetaMask) return true;
    const providers = Array.isArray(eth.providers) ? eth.providers : [eth];
    const blob = JSON.stringify(
      providers.map((p) => {
        const o = p as Record<string, unknown>;
        return {
          isMetaMask: o.isMetaMask,
          isRabby: o.isRabby,
          isOkxWallet: o.isOkxWallet,
          isTrust: o.isTrust,
          isCoinbaseWallet: o.isCoinbaseWallet,
          isBitKeep: o.isBitKeep,
          isBitget: o.isBitget,
        };
      })
    ).toLowerCase();
    if (key === "metamask" && blob.includes("ismetamask\":true")) return true;
    if (key === "rabby" && blob.includes("israbby\":true")) return true;
    if (key === "okx" && (blob.includes("isokx") || blob.includes("okx"))) return true;
    if (key === "bitget" && (blob.includes("isbitkeep") || blob.includes("isbitget") || blob.includes("bitget"))) {
      return true;
    }
    if (key === "trust" && blob.includes("istrust\":true")) return true;
    if (key === "coinbase" && blob.includes("iscoinbasewallet\":true")) return true;
  } catch {
    /* ignore */
  }
  return connector.type === "injected";
}

export function isLikelySafeApp(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.parent !== window) return true;
    const href = window.location?.href ?? "";
    return /app\.safe\.global|gnosis-safe\.io|safe\.global/i.test(href);
  } catch {
    return false;
  }
}

export function catalogueConnectors(connectors: readonly Connector[]): {
  recommended: CataloguedConnector[];
  walletConnect: CataloguedConnector[];
  injectedOther: CataloguedConnector[];
  safe: CataloguedConnector[];
  other: CataloguedConnector[];
} {
  const seen = new Set<string>();
  const items: CataloguedConnector[] = [];
  for (const connector of connectors) {
    const brandKey = connectorBrandKey(connector);
    const dedupe = `${brandKey}:${connector.uid}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    items.push({
      connector,
      kind: classifyConnector(connector),
      brandKey,
      installed: isConnectorInstalled(connector),
    });
  }

  const recommended = items
    .filter((i) => i.kind === "recommended")
    .sort(
      (a, b) =>
        WALLET_RECOMMENDED_ORDER.indexOf(a.brandKey as (typeof WALLET_RECOMMENDED_ORDER)[number]) -
        WALLET_RECOMMENDED_ORDER.indexOf(b.brandKey as (typeof WALLET_RECOMMENDED_ORDER)[number])
    );
  return {
    recommended,
    walletConnect: items.filter((i) => i.kind === "walletConnect"),
    injectedOther: items.filter((i) => i.kind === "injectedOther"),
    safe: items.filter((i) => i.kind === "safe" && isLikelySafeApp()),
    other: items.filter((i) => i.kind === "other"),
  };
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
