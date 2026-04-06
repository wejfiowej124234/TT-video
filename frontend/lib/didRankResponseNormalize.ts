/**
 * DID 榜 GET 响应行归一化（与 `app/did-rank/page.tsx` 消费一致，便于单测与复用）。
 */

import type { TravelerRankItem, GuideRankItem, ItineraryRankItem } from "@/lib/didRankMockData";

/** 后端 `GET /api/v1/did-rank/*` 返回 `{ travelers|guides|itineraries, period, since, limit, rank_basis }`；亦兼容 `items` 或裸数组 */
export function extractDidRankList(raw: unknown, key: "travelers" | "guides" | "itineraries"): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const v = o[key];
    if (Array.isArray(v)) return v;
    if (Array.isArray(o.items)) return o.items;
  }
  return [];
}

export function normalizeDidRankTravelerRow(x: unknown): TravelerRankItem | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const rank = typeof r.rank === "number" ? r.rank : Number(r.rank);
  const nickname = typeof r.nickname === "string" ? r.nickname : "";
  if (!id || !nickname || !Number.isFinite(rank)) return null;
  const countries = Array.isArray(r.countries)
    ? r.countries.filter((c): c is string => typeof c === "string")
    : [];
  const cities = Array.isArray(r.cities) ? r.cities.filter((c): c is string => typeof c === "string") : [];
  const completed_orders_raw = r.completed_orders ?? r.completedOrders;
  const completed_orders =
    typeof completed_orders_raw === "number" && Number.isFinite(completed_orders_raw)
      ? completed_orders_raw
      : undefined;
  return {
    id,
    rank,
    nickname,
    is_me: r.is_me === true,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
    ...(completed_orders !== undefined ? { completed_orders } : {}),
    totalSpentUsdt: typeof r.totalSpentUsdt === "number" ? r.totalSpentUsdt : 0,
    countriesCount: typeof r.countriesCount === "number" ? r.countriesCount : countries.length,
    citiesCount: typeof r.citiesCount === "number" ? r.citiesCount : cities.length,
    countries: countries.length ? countries : undefined,
    cities: cities.length ? cities : undefined,
  };
}

function receptionGrossAsNumber(r: Record<string, unknown>): number {
  const raw = r.reception_gross_total;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : Number.NaN;
  }
  return Number.NaN;
}

export function normalizeDidRankGuideRow(x: unknown): GuideRankItem | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const rank = typeof r.rank === "number" ? r.rank : Number(r.rank);
  const nickname = typeof r.nickname === "string" ? r.nickname : "";
  if (!id || !nickname || !Number.isFinite(rank)) return null;
  const grossNum = receptionGrossAsNumber(r);
  const totalAmountUsdt =
    typeof r.totalAmountUsdt === "number"
      ? r.totalAmountUsdt
      : Number.isFinite(grossNum)
        ? grossNum
        : 0;
  const receptionCount =
    typeof r.reception_count === "number"
      ? r.reception_count
      : typeof r.receptionCount === "number"
        ? r.receptionCount
        : 0;
  const receivedReviewCount =
    typeof r.received_review_count === "number"
      ? r.received_review_count
      : typeof r.receivedReviewCount === "number"
        ? r.receivedReviewCount
        : 0;
  let avgReceivedReviewScore: number | null | undefined;
  if ("avg_received_review_score" in r) {
    const v = r.avg_received_review_score;
    if (typeof v === "number" && Number.isFinite(v)) avgReceivedReviewScore = v;
    else if (v === null) avgReceivedReviewScore = null;
  } else if ("avgReceivedReviewScore" in r) {
    const v = r.avgReceivedReviewScore;
    if (typeof v === "number" && Number.isFinite(v)) avgReceivedReviewScore = v;
    else if (v === null) avgReceivedReviewScore = null;
  }
  return {
    id,
    rank,
    nickname,
    is_me: r.is_me === true,
    avatar_url: typeof r.avatar_url === "string" ? r.avatar_url : null,
    city: typeof r.city === "string" ? r.city : undefined,
    totalAmountUsdt,
    receptionCount,
    receivedReviewCount,
    ...(avgReceivedReviewScore !== undefined ? { avgReceivedReviewScore } : {}),
  };
}

export function normalizeDidRankItineraryRow(x: unknown, dash: string): ItineraryRankItem | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const idRaw = r.id ?? r.order_id;
  const id = typeof idRaw === "string" ? idRaw : "";
  const rank = typeof r.rank === "number" ? r.rank : Number(r.rank);
  if (!id || !Number.isFinite(rank)) return null;
  const destination = typeof r.destination === "string" ? r.destination : "";
  const city = typeof r.city === "string" ? r.city : "";
  const title =
    typeof r.title === "string" && r.title.trim()
      ? r.title.trim()
      : [destination, city].filter(Boolean).join(" · ") || `Order ${id.slice(0, 8)}…`;
  const creatorCommunityRaw = r.creatorCommunityUserId ?? r.creator_community_user_id;
  const creatorCommunityUserId =
    typeof creatorCommunityRaw === "string" && creatorCommunityRaw.trim() ? creatorCommunityRaw.trim() : undefined;
  return {
    id,
    rank,
    title,
    is_me: r.is_me === true,
    creatorName: typeof r.creatorName === "string" ? r.creatorName : dash,
    creatorType: r.creatorType === "traveler" ? "traveler" : "guide",
    creatorCommunityUserId,
    useCount:
      typeof r.useCount === "number"
        ? r.useCount
        : typeof r.total_days === "number"
          ? r.total_days
          : 0,
    rating: typeof r.rating === "number" ? r.rating : 0,
    reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : 0,
    coverImage: typeof r.coverImage === "string" ? r.coverImage : null,
    destination: destination || undefined,
  };
}
