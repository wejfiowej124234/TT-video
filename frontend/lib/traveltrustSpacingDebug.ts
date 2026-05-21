/** `/traveltrust` 区块垂直间距调试（① 本地 · `?tt_spacing=1`） */

export const TT_SPACING_DEBUG_QUERY = "tt_spacing";
export const TT_SPACING_DEBUG_STORAGE_KEY = "tt_spacing_debug";

export const TT_SPACING_DEBUG_SECTION_LABELS: Record<string, string> = {
  theater: "旅行角色",
  liquidity: "兑换网关",
  trust: "信任事实",
  settlement: "结算条",
  faq: "常见问题",
  start: "开始",
};

/** 节与节之间期望外间距（ideal · 对齐 `TT_PAGE_SPACING_AUDIT_L5`） */
export const TT_SPACING_DEBUG_GAP_TARGETS_PX: Record<string, number> = {
  "theater→liquidity": 64,
  "liquidity→trust": 44,
  "trust→settlement": 44,
  "settlement→faq": 64,
  "faq→start": 64,
};

export function isTravelTrustSpacingDebugDevHost(): boolean {
  return process.env.NODE_ENV === "development";
}

/** 生产叙事页不挂调试 chrome；仅 ① dev 或 `?tt_spacing=1` */
export function shouldMountTravelTrustSpacingDebug(): boolean {
  if (isTravelTrustSpacingDebugDevHost()) return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get(TT_SPACING_DEBUG_QUERY) === "1";
}

export function isTravelTrustSpacingDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const fromQuery = new URLSearchParams(window.location.search).get(TT_SPACING_DEBUG_QUERY) === "1";
  if (fromQuery) return true;
  try {
    return window.localStorage.getItem(TT_SPACING_DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTravelTrustSpacingDebugEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.setItem(TT_SPACING_DEBUG_STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(TT_SPACING_DEBUG_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function buildTravelTrustSpacingDebugUrl(enabled: boolean): string {
  const url = new URL(window.location.href);
  if (enabled) {
    url.searchParams.set(TT_SPACING_DEBUG_QUERY, "1");
  } else {
    url.searchParams.delete(TT_SPACING_DEBUG_QUERY);
  }
  return url.toString();
}
