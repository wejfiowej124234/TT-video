/**
 * Unified Primary Market price SSOT for FE (Official V8 Runtime vs LEGACY $25/10M).
 *
 * Official live = NEW PrimaryMarket + 25T TTG:
 *   1 USDC = 100,000 TTG · min 1 USDC · 10 USDC → 1,000,000 TTG.
 * LEGACY $25 / 10M is disclosure-only — not Live, not “pending Timelock execute”.
 *
 * Parent overlay: registry/ttg-v8-api-runtime-contract-overlay.v1.json
 * Homepage /traveltrust #liquidity first-paint MUST match this Official Runtime.
 * Official www bake remains a separate Owner gate (compiled pin may lag).
 */

/** Official Mainnet V8 PrimaryMarket live unit (NEW PM · 1e23 wei TTG per 1 USDC) */
export const PRIMARY_MARKET_LIVE_TTG_PER_USDC_UNIT = "100000000000000000000000" as const;
/** Integer TTG received per 1 USDC (avoids 0.00001 float divide) */
export const PRIMARY_MARKET_LIVE_TTG_PER_USDC = 100_000 as const;
/** Overlay `pricing.usdc_per_ttg` */
export const PRIMARY_MARKET_LIVE_USDC_PER_TTG = 0.00001 as const;
/** Primary Market min purchase (USDC) */
export const PRIMARY_MARKET_LIVE_MIN_USDC = 1 as const;
export const PRIMARY_MARKET_LIVE_CLASS = "TTG_V8_OFFICIAL_RUNTIME_QUOTE" as const;
export const PRIMARY_MARKET_LIVE_TTG_ADDRESS =
  "0x0EC40c8a4ff31Fcc9e65121C1A38310df0413602" as const;
export const PRIMARY_MARKET_LIVE_PM_ADDRESS =
  "0x882Ad1926cCea965C189a83aB12a02dBcCB8B6D2" as const;

/** LEGACY 10M $25 economic SSOT (disclosure · not Official Live) */
export const PRIMARY_MARKET_CANDIDATE_TTG_PER_USDC_UNIT = "40000000000000000" as const;
export const PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG = 25 as const;
export const PRIMARY_MARKET_CANDIDATE_CLASS = "PRODUCT_READY_WAITING_RUNTIME" as const;

/** LEGACY $25 10M upgrade package — SUPERSEDED by V8 NEW PM (kept for import stability) */
export const PRIMARY_MARKET_PENDING_NEW_IMPL = "0x53d0dA76BC618eC90D2FF497D400b1F9af5AFc6b" as const;
export const PRIMARY_MARKET_PENDING_OP_ID =
  "0xb7d2a7c37a6f8aca08d41a1f0c54ded6d83429a918cda89b9271aaad0b551b12" as const;

export type PrimaryMarketQuoteSurface = "official_runtime" | "economic_candidate";

export function quoteUsdcToTtg(
  payUsdc: number,
  surface: PrimaryMarketQuoteSurface,
): { receiveTtg: number; usdcPerTtg: number; surface: PrimaryMarketQuoteSurface } | null {
  if (!Number.isFinite(payUsdc) || payUsdc <= 0) return null;
  if (surface === "official_runtime") {
    return {
      receiveTtg: payUsdc * PRIMARY_MARKET_LIVE_TTG_PER_USDC,
      usdcPerTtg: PRIMARY_MARKET_LIVE_USDC_PER_TTG,
      surface,
    };
  }
  return {
    receiveTtg: payUsdc / PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG,
    usdcPerTtg: PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG,
    surface,
  };
}

/** Local `/traveltrust#liquidity` first-paint rate string (8 dp · matches V8 overlay). */
export function formatLiveUsdcPerTtg(rate: number = PRIMARY_MARKET_LIVE_USDC_PER_TTG): string {
  return rate.toFixed(8);
}

function formatLiveReceiveTtg(receiveTtg: number): string {
  if (!Number.isFinite(receiveTtg)) return "";
  if (Number.isInteger(receiveTtg) || Math.abs(receiveTtg - Math.round(receiveTtg)) < 1e-9) {
    return String(Math.round(receiveTtg));
  }
  return receiveTtg.toFixed(4);
}

/**
 * Local Gateway first-paint / illustrative quote.
 * V8 Active Truth only — not Official www 200 CNY / 3.6000 TTG pin math.
 */
export function quoteTtgLocalFirstPaintFromUsdc(payAmount: string): {
  receiveTtg: string;
  payUsdc: number;
  rateUsdcPerTtg: string;
  referencePriceUsdcPerTtg: number;
  liveClass: typeof PRIMARY_MARKET_LIVE_CLASS;
} | null {
  const pay = Number.parseFloat(payAmount.trim().replace(/,/g, ""));
  if (!Number.isFinite(pay) || pay < PRIMARY_MARKET_LIVE_MIN_USDC) return null;
  const q = quoteUsdcToTtg(pay, "official_runtime");
  if (!q) return null;
  return {
    receiveTtg: formatLiveReceiveTtg(q.receiveTtg),
    payUsdc: pay,
    rateUsdcPerTtg: formatLiveUsdcPerTtg(q.usdcPerTtg),
    referencePriceUsdcPerTtg: q.usdcPerTtg,
    liveClass: PRIMARY_MARKET_LIVE_CLASS,
  };
}

/** Dual disclosure: Official V8 live vs LEGACY $25/10M (do not collapse) */
export function primaryMarketDualQuote(payUsdc: number) {
  return {
    officialRuntime: quoteUsdcToTtg(payUsdc, "official_runtime"),
    economicCandidate: quoteUsdcToTtg(payUsdc, "economic_candidate"),
    liveClass: PRIMARY_MARKET_LIVE_CLASS,
    candidateClass: PRIMARY_MARKET_CANDIDATE_CLASS,
    pendingImpl: PRIMARY_MARKET_PENDING_NEW_IMPL,
    pendingOpId: PRIMARY_MARKET_PENDING_OP_ID,
    executePending: false,
  };
}

/** Public Sale notional at LEGACY $25 (inventory caps · not raised cash · 10M era) */
export const PUBLIC_SALE_ROUND_NOTIONAL_USDC = {
  r1_800k_ttg: 20_000_000,
  r2_1_2m_ttg: 30_000_000,
  r3_3m_ttg: 75_000_000,
  total_5m_ttg: 125_000_000,
} as const;

/** Seat Funding USD = Seat TTG × 25 · NOT “already raised” */
export const SEAT_FUNDING_NOTIONAL_USDC_TOTAL = 72_500_000 as const;
export const SEAT_FUNDING_DISCLOSURE =
  "notional_acquisition_value_not_cash_raised" as const;
