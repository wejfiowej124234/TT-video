/**
 * Escrow / draft order page — single display total (order.amount vs itinerary breakdown).
 */

export type EscrowAmountBreakdownLike = {
  hotel?: number | null;
  catering?: number | null;
  tickets?: number | null;
  guide_fee?: number | null;
  vehicle?: number | null;
  platform_fee?: number | null;
  total_budget?: number | null;
};

export function parseEscrowOrderAmount(amount: string | number | null | undefined): number | null {
  if (amount == null || amount === "") return null;
  const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function sumEscrowBreakdownParts(breakdown: EscrowAmountBreakdownLike | null | undefined): number | null {
  if (!breakdown) return null;
  const parts = [
    breakdown.hotel,
    breakdown.catering,
    breakdown.tickets,
    breakdown.guide_fee,
    breakdown.vehicle,
    breakdown.platform_fee,
  ].filter((v): v is number => v != null && Number.isFinite(v));
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100;
}

export type EscrowDisplayAmountResolved = {
  /** Formatted amount string for UI headline */
  displayAmount: string;
  canonicalTotal: number | null;
  orderAmountNum: number | null;
  breakdownTotal: number | null;
  lineSum: number | null;
  /** order.amount differs from breakdown total_budget */
  amountMismatch: boolean;
  /** sum(hotel…platform_fee) differs from total_budget */
  lineItemsMismatch: boolean;
};

export function resolveEscrowDisplayAmount(
  orderAmount: string | number | null | undefined,
  breakdown: EscrowAmountBreakdownLike | null | undefined,
): EscrowDisplayAmountResolved {
  const orderAmountNum = parseEscrowOrderAmount(orderAmount);
  const lineSum = sumEscrowBreakdownParts(breakdown);
  const breakdownTotal =
    breakdown?.total_budget != null && Number.isFinite(breakdown.total_budget)
      ? Math.round(breakdown.total_budget * 100) / 100
      : lineSum;

  const lineItemsMismatch =
    lineSum != null &&
    breakdownTotal != null &&
    breakdown?.total_budget != null &&
    Math.abs(lineSum - breakdownTotal) > 0.009;

  /** Prefer auditable line sum when it disagrees with stored total_budget */
  const canonicalTotal = lineItemsMismatch && lineSum != null ? lineSum : breakdownTotal ?? orderAmountNum;
  const amountMismatch =
    orderAmountNum != null &&
    canonicalTotal != null &&
    Math.abs(orderAmountNum - canonicalTotal) > 0.009;

  let displayAmount: string;
  if (canonicalTotal != null) {
    displayAmount = canonicalTotal.toFixed(2);
  } else if (orderAmount != null && String(orderAmount).trim() !== "") {
    displayAmount = String(orderAmount).trim();
  } else {
    displayAmount = "—";
  }

  return {
    displayAmount,
    canonicalTotal,
    orderAmountNum,
    breakdownTotal,
    lineSum,
    amountMismatch,
    lineItemsMismatch,
  };
}

/** Consumer quote surfaces (landing, draft order, market cards) — must match locales. */
export const CONSUMER_TRIP_CURRENCY_LOCALE_KEY = "traveler_quote_currency" as const;

/** Protocol / post-escrow on-chain display when API still says USD. Consumer drafts use `traveler_quote_currency`. */
export function formatEscrowStablecoinCurrency(currency: string | undefined | null): string {
  const c = (currency ?? "").trim().toUpperCase();
  if (c === "" || c === "USD" || c === "USDC" || c === "USDT") return "USDC";
  return (currency ?? "").trim() || "USDC";
}

/** Align stored total_budget with sum of line items before PATCH itinerary. */
export function normalizeBreakdownTotals<T extends EscrowAmountBreakdownLike>(
  breakdown: T | null | undefined,
): T | null | undefined {
  if (!breakdown) return breakdown;
  const lineSum = sumEscrowBreakdownParts(breakdown);
  if (lineSum == null) return breakdown;
  return { ...breakdown, total_budget: lineSum };
}
