import type { LocaleTranslateFn } from "@/lib/i18n";

import type { ColdStartCampaignItem, ColdStartCampaignPayload } from "./types";

/** Static cover when API omits image (official guide accounts). */
export const COLD_START_CONSUMER_COVER_FALLBACK = "/market-backdrop-travel-guilin-sunset.png";

const ALLOWED_ITEM_TYPES = new Set([
  "official_account",
  "itinerary_template",
  "guide_post",
  "guide",
]);

/** Reject ops / smoke / sprint identifiers and dev terminology in consumer copy. */
const INTERNAL_TEXT_PATTERN =
  /(?:^|[\s_\-/])(?:l5[-_]|probe|sprint|ops_|seed|e2e|smoke|uat|ssot|p0[-_]|p1[-_]|d3[-_]|e2[-_]|cold[_-]?start|home_hero|market_feed|community_feed|item_ref|deploy|rollback|surface|campaign)(?:[\s_\-/]|$)/i;

const INTERNAL_TEXT_START =
  /^(?:l5[-_]|probe|ops_|seed|e2e|smoke|test[-_]|uat[-_])/i;

export type ColdStartConsumerCategory =
  | "official_guide"
  | "official_route"
  | "official_community"
  | "official_activity"
  | "official_plan";

export type ColdStartConsumerHighlightCard = {
  id: string;
  href: string;
  coverUrl: string;
  title: string;
  valueLine: string;
  subtitle: string;
  statusLabel: string;
  ctaLabel: string;
  category: ColdStartConsumerCategory;
  categoryLabel: string;
};

export function isInternalConsumerText(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return true;
  if (INTERNAL_TEXT_START.test(trimmed)) return true;
  if (INTERNAL_TEXT_PATTERN.test(trimmed)) return true;
  if (/^L5[-_]/i.test(trimmed)) return true;
  if (/\bops_/i.test(trimmed)) return true;
  if (/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(trimmed)) return true;
  return false;
}

function resolveItemHref(item: ColdStartCampaignItem): string | null {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "guide" && typeof r.id === "string" && r.id) {
    return `/guides/${encodeURIComponent(r.id)}`;
  }
  if (item.item_type === "official_account" && typeof r.linked_guide_id === "string" && r.linked_guide_id) {
    return `/guides/${encodeURIComponent(r.linked_guide_id)}`;
  }
  if (item.item_type === "itinerary_template" && typeof r.id === "string") {
    return `/market?view=split&cold_start_template=${encodeURIComponent(r.id)}`;
  }
  if (item.item_type === "guide_post" && typeof r.community_post_id === "string" && r.community_post_id) {
    return `/community?post=${encodeURIComponent(r.community_post_id)}`;
  }
  if (item.item_type === "guide_post" && typeof r.id === "string") {
    return `/community?official_guide=${encodeURIComponent(r.id)}`;
  }
  return null;
}

function inferGuidePostCategory(tags: string[] | undefined): ColdStartConsumerCategory {
  const lower = (tags ?? []).map((tag) => tag.toLowerCase());
  if (lower.some((tag) => tag.includes("activity") || tag.includes("event") || tag.includes("活动"))) {
    return "official_activity";
  }
  if (lower.some((tag) => tag.includes("plan") || tag.includes("计划"))) {
    return "official_plan";
  }
  return "official_community";
}

function categoryForItem(item: ColdStartCampaignItem): ColdStartConsumerCategory | null {
  if (item.item_type === "official_account" || item.item_type === "guide") return "official_guide";
  if (item.item_type === "itinerary_template") return "official_route";
  if (item.item_type === "guide_post") {
    const tags = (item.resolved as { tags?: string[] }).tags;
    return inferGuidePostCategory(tags);
  }
  return null;
}

function categoryI18nKey(category: ColdStartConsumerCategory): string {
  return `cold_start_consumer_category_${category}`;
}

function valueI18nKey(category: ColdStartConsumerCategory): string {
  return `cold_start_consumer_value_${category}`;
}

function ctaI18nKey(category: ColdStartConsumerCategory): string {
  return `cold_start_consumer_cta_${category}`;
}

function resolveCoverUrl(item: ColdStartCampaignItem): string {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "itinerary_template" && typeof r.cover_image_url === "string" && r.cover_image_url.trim()) {
    return r.cover_image_url.trim();
  }
  if (item.item_type === "guide_post" && typeof r.cover_url === "string" && r.cover_url.trim()) {
    return r.cover_url.trim();
  }
  return COLD_START_CONSUMER_COVER_FALLBACK;
}

function resolveTitle(item: ColdStartCampaignItem): string | null {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "official_account" && typeof r.display_label === "string") {
    return r.display_label.trim() || null;
  }
  if (item.item_type === "guide") {
    if (typeof r.public_title === "string" && r.public_title.trim()) {
      return r.public_title.trim();
    }
    if (typeof r.city === "string" && r.city.trim()) {
      return r.city.trim();
    }
    return null;
  }
  if (
    (item.item_type === "itinerary_template" || item.item_type === "guide_post") &&
    typeof r.title === "string"
  ) {
    return r.title.trim() || null;
  }
  return null;
}

function resolveSubtitle(item: ColdStartCampaignItem, t: LocaleTranslateFn): string {
  const r = item.resolved as Record<string, unknown>;
  if (item.item_type === "guide_post" && typeof r.destination === "string" && r.destination.trim()) {
    const destination = r.destination.trim();
    if (isInternalConsumerText(destination)) return t("cold_start_consumer_subtitle_default");
    return destination;
  }
  if (item.item_type === "itinerary_template" && typeof r.country_iso === "string" && r.country_iso.trim()) {
    const destination = r.country_iso.trim();
    if (isInternalConsumerText(destination)) return t("cold_start_consumer_subtitle_default");
    return t("cold_start_consumer_subtitle_destination", { destination });
  }
  if (item.item_type === "guide" && typeof r.city === "string" && r.city.trim()) {
    const city = r.city.trim();
    if (isInternalConsumerText(city)) return t("cold_start_consumer_subtitle_default");
    return t("cold_start_consumer_subtitle_destination", { destination: city });
  }
  if (item.item_type === "official_account") {
    return t("cold_start_consumer_subtitle_official_guide");
  }
  return t("cold_start_consumer_subtitle_default");
}

export function buildConsumerHighlightCard(
  item: ColdStartCampaignItem,
  t: LocaleTranslateFn,
): ColdStartConsumerHighlightCard | null {
  if (!ALLOWED_ITEM_TYPES.has(item.item_type)) return null;

  const category = categoryForItem(item);
  if (!category) return null;

  const href = resolveItemHref(item);
  if (!href) return null;

  const title = resolveTitle(item);
  if (!title || isInternalConsumerText(title)) return null;

  const subtitle = resolveSubtitle(item, t);

  return {
    id: item.id,
    href,
    coverUrl: resolveCoverUrl(item),
    title,
    valueLine: t(valueI18nKey(category)),
    subtitle,
    statusLabel: t("cold_start_consumer_status_official"),
    ctaLabel: t(ctaI18nKey(category)),
    category,
    categoryLabel: t(categoryI18nKey(category)),
  };
}

export function filterConsumerHighlightCards(
  items: ColdStartCampaignItem[],
  t: LocaleTranslateFn,
): ColdStartConsumerHighlightCard[] {
  return items
    .map((item) => buildConsumerHighlightCard(item, t))
    .filter((card): card is ColdStartConsumerHighlightCard => card !== null);
}

export function resolveConsumerHomeHeroHighlights(
  campaign: ColdStartCampaignPayload | null,
  items: ColdStartCampaignItem[],
  t: LocaleTranslateFn,
): { visible: boolean; cards: ColdStartConsumerHighlightCard[] } {
  if (!campaign) return { visible: false, cards: [] };
  if (isInternalConsumerText(campaign.name)) return { visible: false, cards: [] };

  const cards = filterConsumerHighlightCards(items, t);
  return { visible: cards.length > 0, cards };
}
