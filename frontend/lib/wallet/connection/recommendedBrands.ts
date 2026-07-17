import type { Connector } from "wagmi";
import {
  WALLET_RECOMMENDED_ORDER,
  catalogueConnectors,
  connectorBrandKey,
  type CataloguedConnector,
} from "@/lib/wallet/walletConnectorCatalog";

export type RecommendedBrandRow = {
  brandKey: (typeof WALLET_RECOMMENDED_ORDER)[number];
  connector: Connector | null;
  installed: boolean;
};

/**
 * Always surface the five recommended brands in Sheet order.
 * Bind EIP-6963 / named connectors when present; otherwise install-help path.
 */
export function buildRecommendedBrandRows(
  connectors: readonly Connector[]
): RecommendedBrandRow[] {
  const catalog = catalogueConnectors(connectors);
  const byBrand = new Map<string, CataloguedConnector>();
  for (const item of catalog.recommended) {
    if (!byBrand.has(item.brandKey)) byBrand.set(item.brandKey, item);
  }
  // Also pick recommended brands that were classified as injectedOther (edge rdns).
  for (const item of [...catalog.injectedOther, ...catalog.other]) {
    if (
      (WALLET_RECOMMENDED_ORDER as readonly string[]).includes(item.brandKey) &&
      !byBrand.has(item.brandKey)
    ) {
      byBrand.set(item.brandKey, item);
    }
  }

  return WALLET_RECOMMENDED_ORDER.map((brandKey) => {
    const hit = byBrand.get(brandKey);
    return {
      brandKey,
      connector: hit?.connector ?? null,
      installed: hit?.installed ?? false,
    };
  });
}

export function findConnectorByBrand(
  connectors: readonly Connector[],
  brandKey: string
): Connector | undefined {
  return connectors.find((c) => connectorBrandKey(c) === brandKey);
}
