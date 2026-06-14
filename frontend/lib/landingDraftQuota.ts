import { getOrders } from "@/lib/apiClient";
import { hasMarketAuthSession } from "@/lib/marketTravelBookmarksSync";

/** 与 `crates/api/src/chain_off/itineraries.rs` · `DRAFT_CAP_PER_USER` 一致。 */
export const LANDING_DRAFT_CAP = 20;

const LANDING_DRAFT_CAP_CACHE_KEY = "tt-landing-draft-cap-v1";

export type LandingDraftQuota = {
  count: number;
  cap: number;
  blocked: boolean;
  /** 列表可见草稿数（可能低于 count，链范围过滤导致） */
  visibleCount?: number;
};

export type DraftCapApiError = Error & {
  draftCount?: number;
  draftCap?: number;
};

export function readDraftCapFromError(err: unknown): { count?: number; cap?: number } {
  if (!(err instanceof Error)) return {};
  const e = err as DraftCapApiError;
  return {
    count: typeof e.draftCount === "number" ? e.draftCount : undefined,
    cap: typeof e.draftCap === "number" ? e.draftCap : undefined,
  };
}

function isDraftOrder(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const row = item as { status?: string; state?: string };
  const status = String(row.status ?? row.state ?? "")
    .trim()
    .toLowerCase();
  return status === "draft";
}

function readCachedLandingDraftCap(): LandingDraftQuota | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LANDING_DRAFT_CAP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LandingDraftQuota;
    if (
      typeof parsed.count === "number" &&
      typeof parsed.cap === "number" &&
      parsed.blocked === true &&
      parsed.count >= parsed.cap
    ) {
      return parsed;
    }
  } catch {
    /* noop */
  }
  return null;
}

export function writeCachedLandingDraftCap(quota: LandingDraftQuota): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LANDING_DRAFT_CAP_CACHE_KEY, JSON.stringify(quota));
  } catch {
    /* noop */
  }
}

export function clearCachedLandingDraftCap(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(LANDING_DRAFT_CAP_CACHE_KEY);
  } catch {
    /* noop */
  }
}

function mergeDraftQuota(listCount: number, cached: LandingDraftQuota | null): LandingDraftQuota {
  const cap = LANDING_DRAFT_CAP;
  if (listCount >= cap) {
    const quota: LandingDraftQuota = {
      count: listCount,
      cap,
      blocked: true,
      visibleCount: listCount,
    };
    writeCachedLandingDraftCap(quota);
    return quota;
  }
  // API 已列出真实 Draft 数；低于 cap 时清掉 session 里旧的 409 缓存，避免删草稿后仍显示 20/20。
  if (cached?.blocked) clearCachedLandingDraftCap();
  return {
    count: listCount,
    cap,
    blocked: false,
    visibleCount: listCount,
  };
}

/** 已登录时读取当前用户 Draft 数量，用于首页生成前预检。 */
export async function fetchLandingDraftQuota(): Promise<LandingDraftQuota> {
  const cached = readCachedLandingDraftCap();
  if (!hasMarketAuthSession()) {
    return { count: 0, cap: LANDING_DRAFT_CAP, blocked: false };
  }
  try {
    const { items } = await getOrders({ state: "draft", limit: 200 });
    const listCount = items.filter(isDraftOrder).length;
    return mergeDraftQuota(listCount, cached);
  } catch {
    return cached ?? { count: 0, cap: LANDING_DRAFT_CAP, blocked: false };
  }
}

export function draftQuotaFromCapError(err: unknown): LandingDraftQuota {
  const { count: apiCount, cap: apiCap } = readDraftCapFromError(err);
  const cap = apiCap ?? LANDING_DRAFT_CAP;
  const count = apiCount ?? cap;
  const quota: LandingDraftQuota = {
    count,
    cap,
    blocked: true,
  };
  writeCachedLandingDraftCap(quota);
  return quota;
}
