import type { OrderCardItem } from "@/lib/marketTypes";
import { marketOrderCardTeaser } from "@/lib/marketMediaFallback";

/** ① 本地 seed / 烟测 / 收购自动向导等内部文案 — 不在市场卡片外露 */
const INTERNAL_MARKET_COPY = [
  /auto-provisioned/i,
  /PD-009 acquisition fulfillment/i,
  /^smoke save$/i,
  /^smoke[\s_-]/i,
  /traveltrust\.test/i,
  /^test[\s_-]?guide/i,
  /^①\s*本地示意/i,
  /测试向导/i,
  /用于联调/i,
  /联调(?:账号|账户|向导)/i,
  /hangzhou test guide/i,
  /^test guide account/i,
  /trust[-_\s]?gate/i,
  /\be2e\b/i,
] as const;

/** 向导 service_types 中不向公众展示的系统/烟测/收购履约标签 */
const INTERNAL_GUIDE_SERVICE_TYPE = [
  /^acquisition_fulfillment$/i,
  /^pd[-_]?009/i,
  /^auto[-_]?provision/i,
  /^smoke[\s_-]/i,
  /^internal[\s_-]/i,
  /^fulfillment_bond$/i,
  /^test[\s_-]/i,
] as const;

function normalizeGuideServiceSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

export function isInternalGuideServiceType(raw: string | null | undefined): boolean {
  const slug = normalizeGuideServiceSlug(raw ?? "");
  if (!slug) return true;
  return INTERNAL_GUIDE_SERVICE_TYPE.some((re) => re.test(slug));
}

/** 过滤内部 service_types；保留公众可读 slug */
export function filterGuidePublicServiceTypes(types: string[] | null | undefined): string[] {
  if (!Array.isArray(types)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of types) {
    const slug = normalizeGuideServiceSlug(raw);
    if (!slug || isInternalGuideServiceType(slug) || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
  }
  return out;
}

function humanizeGuideServiceSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** 向导专长标签：i18n 映射 → 标题化 fallback */
export function formatGuideServiceTypeLabel(
  raw: string,
  t: (key: string) => string,
): string {
  const slug = normalizeGuideServiceSlug(raw);
  const key = `market_guide_service_${slug}`;
  const localized = t(key);
  if (localized !== key) return localized;
  return humanizeGuideServiceSlug(slug);
}

const GUIDE_LANGUAGE_I18N_PREFIX = "market_guide_lang_" as const;

/** 向导语言：zh/en → 消费者可读标签；未知 code 保留大写 */
export function formatGuideLanguages(
  languages: string[] | null | undefined,
  t: (key: string) => string,
  sep = " · ",
): string {
  if (!Array.isArray(languages) || languages.length === 0) return t("ui_em_dash");
  return languages
    .map((raw) => {
      const code = raw.trim().toLowerCase();
      if (!code) return "";
      const key = `${GUIDE_LANGUAGE_I18N_PREFIX}${code}`;
      const localized = t(key);
      if (localized !== key) return localized;
      return code.toUpperCase();
    })
    .filter(Boolean)
    .join(sep);
}

export function isInternalMarketSeedCopy(raw: string | null | undefined): boolean {
  const text = (raw ?? "").trim();
  if (!text) return false;
  return INTERNAL_MARKET_COPY.some((re) => re.test(text));
}

/** 公众 catalog 不应展示的占位向导 city（与 API `is_placeholder_global_guide` 同源） */
export function isPlaceholderGlobalGuideCity(city: string | null | undefined): boolean {
  return (city ?? "").trim().toLowerCase() === "global";
}

/** 向导 bio：过滤内部 seed 句；无公众文案时返回 null */
export function formatGuidePublicBio(bio: string | null | undefined, maxLen = 72): string | null {
  const trimmed = (bio ?? "").trim();
  if (!trimmed || isInternalMarketSeedCopy(trimmed)) return null;
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}…` : trimmed;
}

function firstPublicDayDescription(item: OrderCardItem): string | null {
  for (const day of item.itinerary?.daily_itinerary ?? []) {
    const text = (day.description ?? day.content_text ?? "").trim();
    if (text && !isInternalMarketSeedCopy(text)) return text;
  }
  return null;
}

/** 从行程元数据生成一行公众可读摘要（与 discover 卡片长描述同源） */
export function buildMarketOrderItineraryTeaserFallback(
  item: OrderCardItem,
  t: (key: string) => string,
): string | null {
  const route = item.route_label?.trim() || item.city?.trim();
  const days =
    item.days ??
    (item.itinerary?.daily_itinerary?.length ? item.itinerary.daily_itinerary.length : undefined);
  if (!route || !days) return null;
  const countryPart =
    item.country?.trim() ||
    item.destination?.split(/[·,，]/)[0]?.trim() ||
    t("market_order_teaser_country_fallback");
  return t("market_order_teaser_itinerary_line")
    .replace("{{country}}", countryPart)
    .replace("{{days}}", String(days))
    .replace("{{route}}", route);
}

/**
 * 订单卡片摘要：highlights / 行程首日 → 过滤烟测占位 → 结构化 fallback。
 * 绑定单 / 草稿 / dev 示意由 OrderCard 另行分支。
 */
export function resolveMarketOrderCardTeaser(
  item: OrderCardItem,
  t: (key: string) => string,
): string | null {
  const raw = marketOrderCardTeaser(item);
  if (raw && !isInternalMarketSeedCopy(raw)) return raw;
  const dayText = firstPublicDayDescription(item);
  if (dayText) return dayText;
  return buildMarketOrderItineraryTeaserFallback(item, t);
}
