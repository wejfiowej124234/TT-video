/**
 * 56-S3：POST /itineraries 可选 cities[]；与 Landing useLandingPage 语义一致。
 * 首城取自必填 `city`，途经城来自可选多行/逗号分隔文案。
 */

const MAX_DAYS = 30;

export function clampItineraryDays(n: number): number {
  const x = Number.isFinite(n) ? Math.floor(n) : 1;
  return Math.max(1, Math.min(MAX_DAYS, x || 1));
}

/** 拆成候选城市片段（不含主城市） */
export function splitCitiesExtraRaw(raw: string): string[] {
  return raw
    .split(/[\n,，、;；]+/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ItineraryCreateDaysAndCities {
  cities?: string[];
  days: number;
}

/**
 * 无途经城市时：不发送 cities，天数用表单值。
 * 有途经城市时：cities = [主城市, …途经]，去重键为 `trim` + `toLowerCase`（拉丁城市名大小写合并；中文与拼音视为不同名），days = 路线长度（mock 一日一城）。
 */
export function resolveItineraryCreateDaysAndCities(
  primaryCity: string,
  formDays: number,
  citiesExtraRaw: string
): ItineraryCreateDaysAndCities {
  const primary = primaryCity.trim();
  const extras = splitCitiesExtraRaw(citiesExtraRaw);
  if (extras.length === 0) {
    return { cities: undefined, days: clampItineraryDays(formDays) };
  }
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (c: string) => {
    const t = c.trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  };
  push(primary);
  for (const e of extras) push(e);
  if (out.length <= 1) {
    return { cities: undefined, days: clampItineraryDays(formDays) };
  }
  const route = out.slice(0, MAX_DAYS);
  return { cities: route, days: route.length };
}
