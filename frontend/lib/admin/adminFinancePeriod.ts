/**
 * HU-280 · Shared finance period browse facet (URL `?period=`).
 * Amount APIs remain full-snapshot until server supports period (ED).
 */

export type AdminFinancePeriod = "day" | "week" | "month";

export const ADMIN_FINANCE_PERIODS: AdminFinancePeriod[] = ["day", "week", "month"];

export function parseAdminFinancePeriod(raw: string | null | undefined): AdminFinancePeriod {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "day" || v === "week" || v === "month") return v;
  return "day";
}

export function adminFinancePeriodSearchParams(
  current: URLSearchParams | { get: (k: string) => string | null },
  period: AdminFinancePeriod,
): string {
  const next = new URLSearchParams(
    typeof (current as URLSearchParams).toString === "function"
      ? (current as URLSearchParams).toString()
      : "",
  );
  // If not a real URLSearchParams, copy known keys via get only for period
  if (typeof (current as URLSearchParams).toString !== "function") {
    next.set("period", period);
    return next.toString();
  }
  next.set("period", period);
  return next.toString();
}
