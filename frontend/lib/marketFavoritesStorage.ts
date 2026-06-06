/**
 * Order / guide favorites — localStorage SSOT shared by `/` and `/market`.
 * ② server sync: WEB3-P2-009 · MKT-FILT-P2-009 · ③ WEB3-P3-006 / MKT-FILT-P3-005
 */

import { subscribeLocalStorageKeys } from "./localStorageJson";

export const FAV_ORDERS_KEY = "traveltrust_market_fav_orders";
export const FAV_GUIDES_KEY = "traveltrust_market_fav_guides";

/** Legacy landing-only key; merged into FAV_ORDERS_KEY on read. */
export const LANDING_FAVORITE_ORDER_IDS_KEY = "tt_landing_favorite_order_ids_v1";

export function loadFavSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : []);
  } catch {
    return new Set();
  }
}

export function saveFavSet(key: string, set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    if (set.size === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* quota / private mode */
  }
}

/** Merge legacy landing key into market orders key (one-time). */
export function readMergedOrderFavoriteIds(): Set<string> {
  const merged = loadFavSet(FAV_ORDERS_KEY);
  const legacy = loadFavSet(LANDING_FAVORITE_ORDER_IDS_KEY);
  if (legacy.size === 0) return merged;

  for (const id of legacy) merged.add(id);
  saveFavSet(FAV_ORDERS_KEY, merged);
  localStorage.removeItem(LANDING_FAVORITE_ORDER_IDS_KEY);
  return merged;
}

export function writeMergedOrderFavoriteIds(ids: Iterable<string>): void {
  saveFavSet(FAV_ORDERS_KEY, new Set(ids));
  localStorage.removeItem(LANDING_FAVORITE_ORDER_IDS_KEY);
}

export function subscribeMarketFavoritesStorage(onKeyChange: (key: string) => void): () => void {
  return subscribeLocalStorageKeys([FAV_ORDERS_KEY, FAV_GUIDES_KEY], onKeyChange);
}
