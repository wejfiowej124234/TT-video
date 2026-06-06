/**
 * DID 榜 GET 响应行归一化（与 `app/did-rank/page.tsx` 消费一致，便于单测与复用）。
 */

import type { TravelerRankItem, GuideRankItem, ItineraryRankItem } from "@/lib/didRankTypes";

export type DidRankListKey = "travelers" | "guides" | "itineraries" | "providers" | "acquisitions";

/** 后端 `GET /api/v1/did-rank/*` 返回 `{ travelers|guides|itineraries|providers|acquisitions, … }`；亦兼容 `items` 或裸数组 */
export function extractDidRankList(raw: unknown, key: DidRankListKey): unknown[] {
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
  const rankDeltaRaw = r.rank_delta ?? r.rankDelta;
  const rank_delta =
    typeof rankDeltaRaw === "number" && Number.isFinite(rankDeltaRaw) && rankDeltaRaw !== 0
      ? Math.trunc(rankDeltaRaw)
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
    ...(rank_delta !== undefined ? { rank_delta } : {}),
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
  const rankDeltaRaw = r.rank_delta ?? r.rankDelta;
  const rank_delta =
    typeof rankDeltaRaw === "number" && Number.isFinite(rankDeltaRaw) && rankDeltaRaw !== 0
      ? Math.trunc(rankDeltaRaw)
      : undefined;
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
    ...(rank_delta !== undefined ? { rank_delta } : {}),
  };
}

/** 商家 / 收购副榜行 */
export type DidRankSecondaryRankItem = {
  id: string;
  rank: number;
  nickname: string;
  is_me?: boolean;
  avatar_url?: string | null;
  published_listings?: number;
  completed_fulfillment_orders?: number;
  fulfillment_gross_total?: string;
  rank_delta?: number;
};

export function normalizeDidRankSecondaryRow(x: unknown): DidRankSecondaryRankItem | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : "";
  const rank = typeof r.rank === "number" ? r.rank : Number(r.rank);
  const nickname = typeof r.nickname === "string" ? r.nickname : "";
  if (!id || !nickname || !Number.isFinite(rank)) return null;
  const publishedRaw = r.published_listings ?? r.publishedListings;
  const published_listings =
    typeof publishedRaw === "number" && Number.isFinite(publishedRaw)
      ? Math.trunc(publishedRaw)
      : undefined;
  const fulfillmentRaw = r.completed_fulfillment_orders ?? r.completedFulfillmentOrders;
  const completed_fulfillment_orders =
    typeof fulfillmentRaw === "number" && Number.isFinite(fulfillmentRaw)
      ? Math.trunc(fulfillmentRaw)
      : undefined;
  const grossRaw = r.fulfillment_gross_total ?? r.fulfillmentGrossTotal;
  const fulfillment_gross_total =
    typeof grossRaw === "string" && grossRaw.trim() ? grossRaw.trim() : undefined;
  const avatar_url =
    typeof r.avatar_url === "string"
      ? r.avatar_url
      : typeof r.avatarUrl === "string"
        ? r.avatarUrl
        : null;
  const rankDeltaRaw = r.rank_delta ?? r.rankDelta;
  const rank_delta =
    typeof rankDeltaRaw === "number" && Number.isFinite(rankDeltaRaw) && rankDeltaRaw !== 0
      ? Math.trunc(rankDeltaRaw)
      : undefined;
  return {
    id,
    rank,
    nickname,
    ...(r.is_me === true ? { is_me: true } : {}),
    ...(avatar_url ? { avatar_url } : {}),
    ...(published_listings !== undefined ? { published_listings } : {}),
    ...(completed_fulfillment_orders !== undefined ? { completed_fulfillment_orders } : {}),
    ...(fulfillment_gross_total !== undefined ? { fulfillment_gross_total } : {}),
    ...(rank_delta !== undefined ? { rank_delta } : {}),
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
  const rankDeltaRaw = r.rank_delta ?? r.rankDelta;
  const rank_delta =
    typeof rankDeltaRaw === "number" && Number.isFinite(rankDeltaRaw) && rankDeltaRaw !== 0
      ? Math.trunc(rankDeltaRaw)
      : undefined;
  return {
    id,
    rank,
    title,
    is_me: r.is_me === true,
    ...(rank_delta !== undefined ? { rank_delta } : {}),
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
