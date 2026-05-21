/**
 * 全球枢纽 · 城市级 lat/lon SSOT（Pass B · `TT-GLOBE-L5-UNLOCK-EARTH-REALISM` 地理段 · ①）
 * Phase1 针脚 / P3 标签 / P3 光点 / 走廊弧线端点均经 `resolveTraveltrustHubLatLon` 读取。
 */

export const TRAVELTRUST_HUB_GEO_SSOT_ID = "TT-HUB-GEO-SSOT-2026-05" as const;

export type TraveltrustHubGeoId =
  | "cn"
  | "us"
  | "fr"
  | "es"
  | "jp"
  | "th"
  | "sg"
  | "kr"
  | "au"
  | "ae"
  | "in"
  | "vn"
  | "gb"
  | "de"
  | "it"
  | "br"
  | "nz"
  | "fj"
  | "eg"
  | "tr"
  | "za"
  | "mx"
  | "ca"
  | "id";

export type TraveltrustHubGeo = {
  id: TraveltrustHubGeoId;
  /** 城市英文名（维护对照 · 非 i18n key） */
  cityEn: string;
  lat: number;
  lon: number;
};

/** 城市级真实坐标（WGS84 · 示意枢纽 · 非航班数据） */
export const TRAVELTRUST_HUB_GEO_BY_ID: Record<TraveltrustHubGeoId, TraveltrustHubGeo> = {
  cn: { id: "cn", cityEn: "Shanghai", lat: 31.2304, lon: 121.4737 },
  us: { id: "us", cityEn: "New York", lat: 40.7128, lon: -74.006 },
  fr: { id: "fr", cityEn: "Paris", lat: 48.8566, lon: 2.3522 },
  es: { id: "es", cityEn: "Madrid", lat: 40.4168, lon: -3.7038 },
  jp: { id: "jp", cityEn: "Tokyo", lat: 35.6762, lon: 139.6503 },
  th: { id: "th", cityEn: "Bangkok", lat: 13.7563, lon: 100.5018 },
  sg: { id: "sg", cityEn: "Singapore", lat: 1.3521, lon: 103.8198 },
  kr: { id: "kr", cityEn: "Seoul", lat: 37.5665, lon: 126.978 },
  au: { id: "au", cityEn: "Sydney", lat: -33.8688, lon: 151.2093 },
  ae: { id: "ae", cityEn: "Dubai", lat: 25.2048, lon: 55.2708 },
  in: { id: "in", cityEn: "Mumbai", lat: 19.076, lon: 72.8777 },
  vn: { id: "vn", cityEn: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
  gb: { id: "gb", cityEn: "London", lat: 51.5074, lon: -0.1278 },
  de: { id: "de", cityEn: "Berlin", lat: 52.52, lon: 13.405 },
  it: { id: "it", cityEn: "Rome", lat: 41.9028, lon: 12.4964 },
  br: { id: "br", cityEn: "São Paulo", lat: -23.5505, lon: -46.6333 },
  nz: { id: "nz", cityEn: "Auckland", lat: -36.8485, lon: 174.7633 },
  fj: { id: "fj", cityEn: "Suva", lat: -18.1416, lon: 178.4419 },
  eg: { id: "eg", cityEn: "Cairo", lat: 30.0444, lon: 31.2357 },
  tr: { id: "tr", cityEn: "Istanbul", lat: 41.0082, lon: 28.9784 },
  za: { id: "za", cityEn: "Johannesburg", lat: -26.2041, lon: 28.0473 },
  mx: { id: "mx", cityEn: "Mexico City", lat: 19.4326, lon: -99.1332 },
  ca: { id: "ca", cityEn: "Toronto", lat: 43.6532, lon: -79.3832 },
  id: { id: "id", cityEn: "Jakarta", lat: -6.2088, lon: 106.8456 },
};

const HUB_IDS = Object.keys(TRAVELTRUST_HUB_GEO_BY_ID) as TraveltrustHubGeoId[];

export function isTraveltrustHubGeoId(id: string): id is TraveltrustHubGeoId {
  return (HUB_IDS as string[]).includes(id);
}

export function getTraveltrustHubGeo(id: TraveltrustHubGeoId): TraveltrustHubGeo {
  return TRAVELTRUST_HUB_GEO_BY_ID[id];
}

export function resolveTraveltrustHubLatLonById(id: string): { lat: number; lon: number } {
  if (!isTraveltrustHubGeoId(id)) {
    throw new Error(`traveltrustHubGeo: unknown hub id "${id}"`);
  }
  const hub = getTraveltrustHubGeo(id);
  return { lat: hub.lat, lon: hub.lon };
}
