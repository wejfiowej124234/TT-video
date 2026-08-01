import { apiUrl, routes } from "@/lib/api";
import {
  applyDidRankDevPreviewGuides,
  applyDidRankDevPreviewTravelers,
} from "@/lib/didRankDevPreview";
import { didRankDevPreviewEnabled } from "@/lib/didRankDevPreviewGate";
import { attachDidRankRankDeltas } from "@/lib/didRankRankDelta";
import {
  extractDidRankList,
  normalizeDidRankGuideRow,
  normalizeDidRankItineraryRow,
  normalizeDidRankTravelerRow,
} from "@/lib/didRankResponseNormalize";
import type { GuideRankItem, ItineraryRankItem, TravelerRankItem } from "@/lib/didRankTypes";
import { parseGuideSortParam, parsePeriodParam, type GuideLeaderboardSort, type Period } from "@/lib/didRankUtils";
import type { DidRankPageInitialSnapshot } from "@/lib/did-rank/didRankPageInitialData";

const FETCH_TIMEOUT_MS = 2500;
const DEFAULT_PERIOD: Period = "all";
const DEFAULT_GUIDE_SORT: GuideLeaderboardSort = "weighted";

function guideSortQueryParam(sort: GuideLeaderboardSort): string {
  if (sort === "reviews") return "reviews";
  if (sort === "reception") return "reception";
  return "weighted";
}

async function fetchJson(
  url: string,
  extraHeaders?: Record<string, string>,
): Promise<unknown | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "x-request-id": `did-rank-ssr-${Date.now()}`,
        ...extraHeaders,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { status?: string };
    if (data.status && data.status !== "ok") return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function withDevPreviewLists(travelers: TravelerRankItem[], guides: GuideRankItem[]) {
  if (!didRankDevPreviewEnabled()) {
    return { travelers, guides, devPreviewActive: false };
  }
  const tOut = applyDidRankDevPreviewTravelers(travelers);
  const gOut = applyDidRankDevPreviewGuides(guides);
  return {
    travelers: tOut,
    guides: gOut,
    devPreviewActive: tOut !== travelers || gOut !== guides,
  };
}

function normalizeRankLists(
  tRaw: unknown,
  gRaw: unknown,
  period: Period,
  guideSort: GuideLeaderboardSort,
): Pick<DidRankPageInitialSnapshot, "travelers" | "guides" | "devPreviewActive"> | null {
  if (!tRaw && !gRaw) return null;
  const apiTravelers = extractDidRankList(tRaw, "travelers")
    .map(normalizeDidRankTravelerRow)
    .filter((x): x is TravelerRankItem => x != null);
  const apiGuides = extractDidRankList(gRaw, "guides")
    .map(normalizeDidRankGuideRow)
    .filter((x): x is GuideRankItem => x != null);
  const previewed = withDevPreviewLists(apiTravelers, apiGuides);
  const travelers = previewed.travelers.some((r) => r.rank_delta != null)
    ? previewed.travelers
    : attachDidRankRankDeltas(previewed.travelers, `${period}:travelers`);
  const guides = previewed.guides.some((r) => r.rank_delta != null)
    ? previewed.guides
    : attachDidRankRankDeltas(previewed.guides, `${period}:${guideSort}`);
  return { travelers, guides, devPreviewActive: previewed.devPreviewActive };
}

function parsePrizePool(raw: unknown): DidRankPageInitialSnapshot["prizePool"] {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const amount = o.monthly_amount ?? o.monthlyAmount;
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  const illustrative = o.illustrative === true || o.source !== "env";
  return {
    amount: Math.max(0, Math.round(amount)),
    illustrative,
    apiConnected: true,
    note: typeof o.note === "string" ? o.note : null,
    source: typeof o.source === "string" ? o.source : undefined,
  };
}

export type DidRankPageInitialFetchOpts = {
  period?: string | null;
  guideSort?: string | null;
  /** RSC：转发 `traveltrust_user_id` cookie → `X-User-Id`，榜行 `is_me` SSR 对齐 */
  forwardAuthHeaders?: Record<string, string>;
};

function normalizeItineraries(raw: unknown, period: Period): ItineraryRankItem[] {
  if (!raw) return [];
  const dash = "—";
  const rows = extractDidRankList(raw, "itineraries")
    .map((x) => normalizeDidRankItineraryRow(x, dash))
    .filter((x): x is ItineraryRankItem => x != null);
  if (rows.some((r) => r.rank_delta != null)) return rows;
  return attachDidRankRankDeltas(rows, `itinerary:${period}`);
}

/** 并行拉 travelers + guides + itineraries + prize-pool；失败时返回 null（客户端照常 fetch） */
export async function fetchDidRankPageInitialSnapshot(
  opts?: DidRankPageInitialFetchOpts,
): Promise<DidRankPageInitialSnapshot | null> {
  const period = parsePeriodParam(opts?.period ?? null, DEFAULT_PERIOD);
  const guideSort = parseGuideSortParam(opts?.guideSort ?? null);
  const sortQ = guideSortQueryParam(guideSort);
  const auth = opts?.forwardAuthHeaders ?? {};
  const [tRaw, gRaw, iRaw, prizeRaw] = await Promise.all([
    fetchJson(`${apiUrl(routes.didRankTravelers)}?period=${period}`, auth),
    fetchJson(`${apiUrl(routes.didRankGuides)}?period=${period}&sort=${sortQ}`, auth),
    fetchJson(`${apiUrl(routes.didRankItineraries)}?period=${period}`, auth),
    fetchJson(apiUrl(routes.didRankPrizePool), auth),
  ]);

  const lists = normalizeRankLists(tRaw, gRaw, period, guideSort);
  if (!lists) return null;

  return {
    period,
    guideSort,
    ...lists,
    itineraries: normalizeItineraries(iRaw, period),
    prizePool: parsePrizePool(prizeRaw),
  };
}
