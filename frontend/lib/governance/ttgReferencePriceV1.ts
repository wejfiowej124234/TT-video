/** TTG 参考价 v1 · ① Mock Swap / FDV（与募资表独立） */

export const TTG_REFERENCE_PRICE_V1 = {
  id: "ttg-reference-price-v1-draft-20260615",
  referencePriceCnyPerTtg: 200,
  fdvCny: 2_000_000_000,
  totalSupplyTtg: 10_000_000,
  mockUsdcCnyFx: 7.2,
} as const;

export const TTG_MOCK_USDC_PER_TTG = TTG_REFERENCE_PRICE_V1.referencePriceCnyPerTtg / TTG_REFERENCE_PRICE_V1.mockUsdcCnyFx;

export function formatUsdcRate(rate: number): string {
  return rate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

export function formatCnyFdvBillions(fdvCny: number, locale: string): string {
  const billions = fdvCny / 1_000_000_000;
  return billions.toLocaleString(locale.startsWith("zh") ? "zh-CN" : "en-US", {
    maximumFractionDigits: 1,
  });
}

export function quoteTtgMockSwapFromUsdc(
  payAmount: string,
): { receiveTtg: string; payUsdc: number } | null {
  const pay = Number.parseFloat(payAmount.trim());
  if (!Number.isFinite(pay) || pay <= 0) return null;
  const receive = pay / TTG_MOCK_USDC_PER_TTG;
  return { receiveTtg: receive.toFixed(4), payUsdc: pay };
}
