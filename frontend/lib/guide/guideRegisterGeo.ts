import { CITIES_BY_COUNTRY, LANGUAGES_BY_COUNTRY, SERVICE_TYPE_OPTIONS } from "@/lib/geoOptions";
import { PRODUCT_COUNTRIES } from "@/lib/productCountries";

export { SERVICE_TYPE_OPTIONS };

const ISO_TO_ZH = Object.fromEntries(PRODUCT_COUNTRIES.map((c) => [c.iso, c.nameZh])) as Record<
  string,
  string
>;
const ZH_TO_ISO = Object.fromEntries(PRODUCT_COUNTRIES.map((c) => [c.nameZh, c.iso])) as Record<
  string,
  string
>;

export function countryIsoToZh(iso: string): string | null {
  const k = iso.trim().toUpperCase();
  return ISO_TO_ZH[k] ?? null;
}

export function countryZhToIso(zh: string): string | null {
  const k = zh.trim();
  return ZH_TO_ISO[k] ?? null;
}

export function cityOptionsForCountryIso(iso: string): { value: string; label: string }[] {
  const zh = countryIsoToZh(iso);
  if (!zh) return [];
  return CITIES_BY_COUNTRY[zh] ?? [];
}

export function languageOptionsForCountryIso(iso: string): { value: string; label: string }[] {
  const zh = countryIsoToZh(iso);
  if (!zh) return [];
  return LANGUAGES_BY_COUNTRY[zh] ?? [];
}

export function parseCommaList(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toggleCommaListValue(current: string, value: string): string {
  const set = new Set(parseCommaList(current));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set].join(", ");
}
