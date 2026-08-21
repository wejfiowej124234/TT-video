/**
 * Unified Primary Market price / address SSOT for FE (V9 Phase1).
 *
 * ACTIVE Official = V9 Phase1 registry · DEPLOYED_PENDING_CUTOVER · sale window not open.
 * LEGACY $25 / 10M and old V8 PM addresses are disclosure-only — not ACTIVE.
 *
 * Addresses: frontend/lib/governance/v9PublicContractRegistry.ts
 */

import {
  V9_PUBLIC_CONTRACTS,
  V9_PUBLIC_DEPLOY_STATUS,
} from "@/lib/governance/v9PublicContractRegistry";

/** Norm Batch-1 illustrative unit (1 USDC → 1,000,000 TTG) · window not open */
export const PRIMARY_MARKET_LIVE_TTG_PER_USDC_UNIT = "1000000000000000000000000" as const;
export const PRIMARY_MARKET_LIVE_TTG_PER_USDC = 1_000_000 as const;
export const PRIMARY_MARKET_LIVE_USDC_PER_TTG = 0.000001 as const;
export const PRIMARY_MARKET_LIVE_MIN_USDC = 1 as const;
export const PRIMARY_MARKET_LIVE_CLASS = "TTG_V9_PHASE1_DEPLOYED_PENDING_CUTOVER" as const;
export const PRIMARY_MARKET_LIVE_STATUS = V9_PUBLIC_DEPLOY_STATUS;

export const PRIMARY_MARKET_LIVE_TTG_ADDRESS = V9_PUBLIC_CONTRACTS.ttg;
export const PRIMARY_MARKET_LIVE_PM_ADDRESS = V9_PUBLIC_CONTRACTS.market;
export const PRIMARY_MARKET_LIVE_PROJECT_POOL_ADDRESS = V9_PUBLIC_CONTRACTS.projectPool;

/** LEGACY 10M $25 economic SSOT (disclosure · not Official Active) */
export const PRIMARY_MARKET_CANDIDATE_TTG_PER_USDC_UNIT = "40000000000000000" as const;
export const PRIMARY_MARKET_CANDIDATE_USDC_PER_TTG = 25 as const;
export const PRIMARY_MARKET_CANDIDATE_CLASS = "LEGACY_PRODUCT_READY_WAITING_RUNTIME" as const;

/** LEGACY V8 upgrade package — SUPERSEDED (kept for import stability) */
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
 * V9 Norm Batch-1 math only — sale window not open · not an invitation to purchase.
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

/** Dual disclosure: V9 Phase1 pending vs LEGACY $25/10M (do not collapse) */
export function primaryMarketDualQuote(payUsdc: number) {
  return {
    officialRuntime: quoteUsdcToTtg(payUsdc, "official_runtime"),
    economicCandidate: quoteUsdcToTtg(payUsdc, "economic_candidate"),
    liveClass: PRIMARY_MARKET_LIVE_CLASS,
    candidateClass: PRIMARY_MARKET_CANDIDATE_CLASS,
    pendingImpl: PRIMARY_MARKET_PENDING_NEW_IMPL,
    pendingOpId: PRIMARY_MARKET_PENDING_OP_ID,
    executePending: true,
    deployStatus: PRIMARY_MARKET_LIVE_STATUS,
  };
}

/** LEGACY notional at $25 (10M era) — disclosure only */
export const PUBLIC_SALE_ROUND_NOTIONAL_USDC = {
  r1_800k_ttg: 20_000_000,
  r2_1_2m_ttg: 30_000_000,
  r3_3m_ttg: 75_000_000,
  total_5m_ttg: 125_000_000,
} as const;

export const SEAT_FUNDING_NOTIONAL_USDC_TOTAL = 72_500_000 as const;
export const SEAT_FUNDING_DISCLOSURE =
  "notional_acquisition_value_not_cash_raised" as const;
