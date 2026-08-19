/** TTG Primary Acquisition Price v2 · $25 USDC（经济 SSOT · Official Live 须等 Timelock） */

export const TTG_REFERENCE_PRICE_V2 = {
  id: "ttg-reference-price-v2-25usdc-20260814",
  docRef: "docs/spec/governance-token/ttg-reference-price-v2-25usdc.md",
  usdcPerTtg: 25,
  ttgPerUsdc: 0.04,
  totalSupplyTtg: 10_000_000,
  fdvUsdc: 250_000_000,
  /** Mainnet target: ttgOut = usdcAmount * unit / 1e6 */
  ttgPerUsdcUnit: "40000000000000000",
  /** Until Timelock execute — Official UI must not claim Live $25 */
  officialRuntimeClass: "PRODUCT_READY_WAITING_RUNTIME" as const,
  liveMainnetSupersededUnit: "1000000000000000000",
  liveMainnetClass: "TECHNICAL_PATH_PASS_SUPERSEDED_ECONOMIC_PRICE" as const,
} as const;

/** @deprecated use TTG_REFERENCE_PRICE_V2 — kept for import path stability */
export const TTG_REFERENCE_PRICE_V1 = {
  id: TTG_REFERENCE_PRICE_V2.id,
  referencePriceCnyPerTtg: null as null,
  fdvCny: null as null,
  totalSupplyTtg: TTG_REFERENCE_PRICE_V2.totalSupplyTtg,
  mockUsdcCnyFx: null as null,
  usdcPerTtg: TTG_REFERENCE_PRICE_V2.usdcPerTtg,
  fdvUsdc: TTG_REFERENCE_PRICE_V2.fdvUsdc,
} as const;

export const TTG_MOCK_USDC_PER_TTG = TTG_REFERENCE_PRICE_V2.usdcPerTtg;

/**
 * Official www pin compiled illustrative quote (08-16 freeze · 200 CNY mock).
 * Local `/traveltrust#liquidity` first-paint uses the public-sale unlock ladder
 * (`quoteTtgPublicSaleFromUsdc`). Do not import these into TravelTrustStablecoinGateway.
 */
export const TTG_OFFICIAL_WWW_GATEWAY_ILLUSTRATIVE = {
  id: "ttg-official-www-gateway-illustrative-200cny",
  referencePriceCnyPerTtg: 200,
  mockUsdcCnyFx: 7.2,
} as const;

export const TTG_OFFICIAL_WWW_USDC_PER_TTG =
  TTG_OFFICIAL_WWW_GATEWAY_ILLUSTRATIVE.referencePriceCnyPerTtg /
  TTG_OFFICIAL_WWW_GATEWAY_ILLUSTRATIVE.mockUsdcCnyFx;

export function formatUsdcRate(rate: number): string {
  return rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatCnyFdvBillions(fdvCny: number, locale: string): string {
  const billions = fdvCny / 1_000_000_000;
  return billions.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    maximumFractionDigits: 1,
  });
}

export function formatUsdcFdvMillions(fdvUsdc: number, locale: string): string {
  const millions = fdvUsdc / 1_000_000;
  return millions.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    maximumFractionDigits: 0,
  });
}

export function quoteTtgMockSwapFromUsdc(
  payAmount: string,
): {
  receiveTtg: string;
  payUsdc: number;
  rateUsdcPerTtg: string;
  referencePriceCnyPerTtg: number;
  referencePriceUsdcPerTtg: number;
  runtimeClass: typeof TTG_REFERENCE_PRICE_V2.officialRuntimeClass;
} | null {
  const pay = Number.parseFloat(payAmount.trim());
  if (!Number.isFinite(pay) || pay <= 0) return null;
  const receive = pay / TTG_OFFICIAL_WWW_USDC_PER_TTG;
  return {
    receiveTtg: receive.toFixed(4),
    payUsdc: pay,
    rateUsdcPerTtg: formatUsdcRate(TTG_OFFICIAL_WWW_USDC_PER_TTG),
    referencePriceCnyPerTtg: TTG_OFFICIAL_WWW_GATEWAY_ILLUSTRATIVE.referencePriceCnyPerTtg,
    referencePriceUsdcPerTtg: TTG_OFFICIAL_WWW_USDC_PER_TTG,
    runtimeClass: TTG_REFERENCE_PRICE_V2.officialRuntimeClass,
  };
}
