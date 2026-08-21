/**
 * TTG 参考价 v1 · LEGACY Mock Swap / FDV only.
 * W-P0-07: NOT ACTIVE Official truth — do not surface on public ACTIVE pages.
 */

export const TTG_REFERENCE_PRICE_V1_CLASS = "LEGACY_DO_NOT_USE_AS_ACTIVE" as const;

export const TTG_REFERENCE_PRICE_V1 = {
  id: "ttg-reference-price-v1-draft-20260615-LEGACY",
  class: TTG_REFERENCE_PRICE_V1_CLASS,
  referencePriceCnyPerTtg: 200,
  fdvCny: 2_000_000_000,
  /** Historical 10M-era mock; ACTIVE supply is 25T Design Lock */
  totalSupplyTtg: 10_000_000,
  mockUsdcCnyFx: 7.2,
} as const;

export const TTG_MOCK_USDC_PER_TTG =
  TTG_REFERENCE_PRICE_V1.referencePriceCnyPerTtg / TTG_REFERENCE_PRICE_V1.mockUsdcCnyFx;

export function formatUsdcRate(rate: number): string {
  return rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatCnyFdvBillions(fdvCny: number, locale: string): string {
  const billions = fdvCny / 1_000_000_000;
  return billions.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    maximumFractionDigits: 1,
  });
}

/** LEGACY mock only — callers must not present as ACTIVE sale quote */
export function quoteTtgMockSwapFromUsdc(
  payAmount: string,
): {
  receiveTtg: string;
  payUsdc: number;
  rateUsdcPerTtg: string;
  referencePriceCnyPerTtg: number;
  class: typeof TTG_REFERENCE_PRICE_V1_CLASS;
} | null {
  const pay = Number.parseFloat(payAmount.trim());
  if (!Number.isFinite(pay) || pay <= 0) return null;
  const receive = pay / TTG_MOCK_USDC_PER_TTG;
  return {
    receiveTtg: receive.toFixed(4),
    payUsdc: pay,
    rateUsdcPerTtg: formatUsdcRate(TTG_MOCK_USDC_PER_TTG),
    referencePriceCnyPerTtg: TTG_REFERENCE_PRICE_V1.referencePriceCnyPerTtg,
    class: TTG_REFERENCE_PRICE_V1_CLASS,
  };
}
