import type { Locale } from "@/lib/i18n";

/** 未来 RTL locale 在此扩展（TT-PH1-178 · ①） */
export const TRAVELTRUST_RTL_LOCALES = new Set<string>([]);

export type TraveltrustTextDirection = "ltr" | "rtl";

export function getTraveltrustTextDirection(locale: Locale): TraveltrustTextDirection {
  return TRAVELTRUST_RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

/** 页内 nav / chip 长文案截断（德语等） */
export function truncateTraveltrustNavLabel(label: string, maxLen = 22): string {
  if (label.length <= maxLen) return label;
  return `${label.slice(0, maxLen - 1)}…`;
}
