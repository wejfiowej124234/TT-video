/**
 * Catalog intercity adapter — API routes → TS mode 列表（S2b Phase 6 · 对拍专用）
 */
import { getInterCityTransportModes } from "../cityDetails/interCityTransport";

export type CatalogApiIntercityRouteRow = {
  mode: string;
  from_city_name_zh: string;
  to_city_name_zh: string;
};

export function readIntercityModesFromTs(fromCity: string, toCity: string): string[] {
  return [...getInterCityTransportModes(fromCity, toCity)].sort();
}

export function mapApiIntercityRoutesToModes(items: CatalogApiIntercityRouteRow[]): string[] {
  return [...new Set(items.map((r) => r.mode))].sort();
}
