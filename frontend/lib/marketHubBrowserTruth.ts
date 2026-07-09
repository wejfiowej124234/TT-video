/**
 * `/market` Hub browser-truth helpers — DevTools / Playwright SSOT for filter → API query parity.
 * Default country is ALL (empty UI state → no country param on discover/guides).
 */

import {
  buildMarketGuideListApiParams,
  type MarketGuideListFilters,
} from "@/lib/marketGuideFilterQuery";

export function marketHubEffectiveCountry(country: string): string {
  return country.trim() || "all";
}

/** Mirrors `useMarketPage` → `getDiscoverOrders` query keys (limit fixed for audit). */
export function buildMarketHubDiscoverOrdersQuery(args: {
  country: string;
  city: string;
  tripDaysFilter: number | null;
  limit?: number;
}): string {
  const sp = new URLSearchParams();
  sp.set("limit", String(args.limit ?? 30));
  const countryVal = args.country.trim();
  const cityVal = args.city.trim();
  if (countryVal) sp.set("country", countryVal);
  if (cityVal) sp.set("city", cityVal);
  if (args.tripDaysFilter != null) sp.set("days", String(args.tripDaysFilter));
  return sp.toString();
}

/** Mirrors `useMarketPage` → `getGuides(buildMarketGuideListApiParams(...))` query keys. */
export function buildMarketHubGuidesQuery(
  filters: MarketGuideListFilters,
  limit = 30,
): string {
  const apiParams = buildMarketGuideListApiParams(filters);
  const sp = new URLSearchParams();
  sp.set("limit", String(limit));
  if (apiParams.country_code) sp.set("country_code", apiParams.country_code);
  if (apiParams.city) sp.set("city", apiParams.city);
  if (apiParams.language) sp.set("language", apiParams.language);
  if (apiParams.service_type) sp.set("service_type", apiParams.service_type);
  return sp.toString();
}
