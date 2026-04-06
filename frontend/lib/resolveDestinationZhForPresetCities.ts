/**
 * 托管页草稿「按日城市」与 `PATCH /api/v1/orders/:id/itinerary` 的 `bundle.destination` + preset_cities 对齐（07 §5.2）。
 * 订单头 → ISO→中文名 → 按日 city 反查国家（与 `/itinerary/new` 同源 `productCountryZhForCityName`）。
 */

import { productCountryZhForCityName } from "@/lib/geoOptions";
import type { UnifiedDayRow } from "@/lib/itineraryUnified";
import {
  isAllowedProductIso3166,
  isAllowedProductZhCountryName,
  PRODUCT_COUNTRIES,
} from "@/lib/productCountries";

/** GET order 中与目的地解析相关的字段子集 */
export type OrderPresetDestinationHead = {
  destination?: unknown;
  country?: unknown;
} | null;

export function resolveDestinationZhForPresetCities(
  order: OrderPresetDestinationHead,
  daily: UnifiedDayRow[],
): string {
  if (!order) return "";
  const dest = String(order.destination ?? "").trim();
  if (isAllowedProductZhCountryName(dest)) return dest;
  const iso = String(order.country ?? "").trim().toUpperCase();
  if (iso && isAllowedProductIso3166(iso)) {
    const row = PRODUCT_COUNTRIES.find((c) => c.iso === iso);
    if (row) return row.nameZh;
  }
  for (const d of daily) {
    const c = String(d.city ?? "").trim();
    if (!c) continue;
    const inferred = productCountryZhForCityName(c);
    if (inferred && isAllowedProductZhCountryName(inferred)) return inferred;
  }
  return dest;
}
