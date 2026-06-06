import type { OrderReviewWeightBreakdown } from "@/lib/apiClient";

export function parseReviewBlockWeightBreakdown(v: unknown): OrderReviewWeightBreakdown | null {
  if (v == null || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const rule_version = typeof o.rule_version === "string" ? o.rule_version : "";
  if (!rule_version) return null;
  const num = (k: string) => (typeof o[k] === "number" && Number.isFinite(o[k] as number) ? (o[k] as number) : NaN);
  const order_amount = num("order_amount");
  const account_age_days = num("account_age_days");
  const amount_factor = num("amount_factor");
  const age_factor = num("age_factor");
  const weight = num("weight");
  const guide_historical_score_reserved = num("guide_historical_score_reserved");
  if ([order_amount, account_age_days, amount_factor, age_factor, weight, guide_historical_score_reserved].some((x) => Number.isNaN(x))) {
    return null;
  }
  return {
    rule_version,
    order_amount,
    account_age_days: Math.round(account_age_days),
    amount_factor,
    age_factor,
    weight,
    guide_historical_score_reserved,
  };
}
