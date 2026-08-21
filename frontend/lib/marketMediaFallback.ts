/**
 * 自由市场列表媒体回退：API 无封面时按目的地提供行业标准的示意图（站内占位 · 禁止 Unsplash）。
 * 仅 UI 展示层；不写入 discover API 响应。
 */

import type { GuideCardItem, OrderCardItem } from "@/lib/marketTypes";
import { communityMediaAbsoluteUrlForRender } from "@/lib/communityMediaClientUrl";

const COVER_W = 640;

function stockPlaceholder(seed: string): string {
  return `/images/market-cover-placeholder.svg?v=${encodeURIComponent(seed || "x")}`;
}

/** 肖像池：站内占位（按 seed 区分 URL · 禁止 Unsplash） */
const GUIDE_PORTRAIT_POOL: readonly string[] = Array.from({ length: 24 }, (_, i) =>
  stockPlaceholder(`guide-portrait-${i}`),
);

/** 城市 / 目的地关键词 → 封面池（同城市多卡按 `id` 稳定分图） */
const CITY_ORDER_COVER_LISTS: Record<string, readonly string[]> = {
  北京: [stockPlaceholder("bj-0"), stockPlaceholder("bj-1"), stockPlaceholder("bj-2")],
  beijing: [stockPlaceholder("bj-0"), stockPlaceholder("bj-1"), stockPlaceholder("bj-2")],
  上海: [stockPlaceholder("sh-0"), stockPlaceholder("sh-1")],
  shanghai: [stockPlaceholder("sh-0"), stockPlaceholder("sh-1")],
  杭州: [stockPlaceholder("hz-0"), stockPlaceholder("hz-1")],
  hangzhou: [stockPlaceholder("hz-0"), stockPlaceholder("hz-1")],
  成都: [stockPlaceholder("cd-0"), stockPlaceholder("cd-1")],
  chengdu: [stockPlaceholder("cd-0"), stockPlaceholder("cd-1")],
  西安: [stockPlaceholder("xa-0"), stockPlaceholder("xa-1")],
  xian: [stockPlaceholder("xa-0"), stockPlaceholder("xa-1")],
  厦门: [stockPlaceholder("xm-0"), stockPlaceholder("xm-1")],
  xiamen: [stockPlaceholder("xm-0"), stockPlaceholder("xm-1")],
  大理: [stockPlaceholder("dl-0"), stockPlaceholder("dl-1")],
  dali: [stockPlaceholder("dl-0"), stockPlaceholder("dl-1")],
  丽江: [stockPlaceholder("lj-0"), stockPlaceholder("lj-1")],
  青岛: [stockPlaceholder("qd-0"), stockPlaceholder("qd-1")],
  qingdao: [stockPlaceholder("qd-0"), stockPlaceholder("qd-1")],
  东京: [stockPlaceholder("tyo-0"), stockPlaceholder("tyo-1")],
  tokyo: [stockPlaceholder("tyo-0"), stockPlaceholder("tyo-1")],
  大阪: [stockPlaceholder("osa-0"), stockPlaceholder("osa-1")],
  首尔: [stockPlaceholder("sel-0"), stockPlaceholder("sel-1")],
  seoul: [stockPlaceholder("sel-0"), stockPlaceholder("sel-1")],
};

const COVER_GRADIENTS = [
  "from-ref-sun/28 via-ink-900/92 to-[#0a0a0a]",
  "from-ref-coral/22 via-ink-900/94 to-[#0c0a09]",
  "from-amber-900/35 via-ink-900/90 to-[#0a0a0a]",
  "from-teal-900/30 via-ink-900/92 to-[#0a0a0a]",
] as const;

function normalizeLocationToken(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

function lookupCityCoverList(...candidates: (string | null | undefined)[]): readonly string[] | null {
  for (const raw of candidates) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    const hit = CITY_ORDER_COVER_LISTS[t] ?? CITY_ORDER_COVER_LISTS[normalizeLocationToken(t)];
    if (hit) return hit;
    const first = t.split(/[·,，/\s]+/)[0]?.trim();
    if (first) {
      const hit2 = CITY_ORDER_COVER_LISTS[first] ?? CITY_ORDER_COVER_LISTS[normalizeLocationToken(first)];
      if (hit2) return hit2;
    }
  }
  return null;
}

function stablePoolIndex(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return modulo > 0 ? h % modulo : 0;
}

function nonEmptyUrl(url: string | null | undefined): string | null {
  const u = (url ?? "").trim();
  return u.length > 0 ? u : null;
}

/** 订单封面：真实 `image` 优先，否则目的地示意（始终尽量返回可加载 URL） */
export function resolveMarketOrderCoverUrl(item: Pick<OrderCardItem, "id" | "image" | "city" | "destination" | "country">): string {
  const explicit = nonEmptyUrl(item.image);
  if (explicit) return explicit;
  const cityList = lookupCityCoverList(item.city, item.destination, item.country);
  if (cityList?.length) {
    return cityList[stablePoolIndex(item.id || item.destination || item.city || "order", cityList.length)];
  }
  const seed = item.id || item.destination || item.city || "order";
  return stockPlaceholder(`order-fallback-${seed}`);
}

/** 无图时的渐变 class（按 id 稳定） */
export function marketCoverGradientClass(seed: string): string {
  return COVER_GRADIENTS[stablePoolIndex(seed, COVER_GRADIENTS.length)];
}

/** 向导头像：API 头像优先；占位图按 guide.id 在扩展肖像池分池 */
export function resolveGuideAvatarUrl(guide: Pick<GuideCardItem, "id" | "avatar_url" | "city" | "user_id">): string {
  const explicit = nonEmptyUrl(guide.avatar_url);
  if (explicit) {
    const remapped = communityMediaAbsoluteUrlForRender(explicit);
    const src = remapped || explicit;
    return src.replace("w=120", `w=${COVER_W}`).replace("q=80", "q=82");
  }
  const idx = stablePoolIndex(guide.id || guide.user_id || guide.city || "guide", GUIDE_PORTRAIT_POOL.length);
  return GUIDE_PORTRAIT_POOL[idx] ?? stockPlaceholder(`guide-${idx}`);
}

/** 抽屉/详情标题：避免 country · city · destination 重复（如「中国 · 北京 · 中国」） */
export function formatMarketOrderDestination(
  item: Pick<OrderCardItem, "country" | "city" | "destination">,
  dash: string,
): string {
  const destination = item.destination?.trim();
  const city = item.city?.trim();
  const country = item.country?.trim();
  if (destination) {
    const prefix = [country, city].filter((part) => part && !destination.includes(part));
    return prefix.length > 0 ? `${prefix.join(" · ")} · ${destination}` : destination;
  }
  const joined = [country, city].filter(Boolean).join(" · ");
  return joined || dash;
}

/** 卡片摘要一行（highlights / 行程首日 content_text 或 description） */
export function marketOrderCardTeaser(item: OrderCardItem): string | null {
  const h = item.highlights?.find((x) => typeof x === "string" && x.trim());
  if (h) return h.trim();
  const day1 = item.itinerary?.daily_itinerary?.find((d) => {
    const text = (d.description ?? d.content_text ?? "").trim();
    return text.length > 0;
  });
  if (day1) {
    return (day1.description ?? day1.content_text ?? "").trim();
  }
  return null;
}
