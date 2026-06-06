/**
 * ① Landing 行程预览：localStorage 恢复 result / unlock / favorite（跨 tab · 刷新不丢卡）
 * ② 账号态：WEB3-P2-012 · WEB3-P2-009
 */
import {
  readJsonStringArrayLocalWithSessionMigration,
  subscribeLocalStorageKeys,
  writeJsonStringArrayLocal,
} from "./localStorageJson";
import {
  FAV_ORDERS_KEY,
  readMergedOrderFavoriteIds,
  writeMergedOrderFavoriteIds,
} from "./marketFavoritesStorage";

export const LANDING_RESULT_ORDER_IDS_KEY = "tt_landing_result_order_ids_v1";
export const LANDING_UNLOCKED_ORDER_IDS_KEY = "tt_landing_unlocked_order_ids_v1";

export function readLandingResultOrderIds(): string[] {
  return readJsonStringArrayLocalWithSessionMigration(LANDING_RESULT_ORDER_IDS_KEY);
}

export function writeLandingResultOrderIds(ids: string[]): void {
  writeJsonStringArrayLocal(LANDING_RESULT_ORDER_IDS_KEY, ids);
}

export function readLandingUnlockedOrderIds(): Set<string> {
  return new Set(readJsonStringArrayLocalWithSessionMigration(LANDING_UNLOCKED_ORDER_IDS_KEY));
}

export function writeLandingUnlockedOrderIds(ids: Iterable<string>): void {
  writeJsonStringArrayLocal(LANDING_UNLOCKED_ORDER_IDS_KEY, [...ids]);
}

export function readLandingFavoriteOrderIds(): Set<string> {
  return readMergedOrderFavoriteIds();
}

export function writeLandingFavoriteOrderIds(ids: Iterable<string>): void {
  writeMergedOrderFavoriteIds(ids);
}

/** Cross-tab sync for landing preview state (storage event from other tabs only). */
export function subscribeLandingItineraryStorage(onKeyChange: (key: string) => void): () => void {
  return subscribeLocalStorageKeys(
    [LANDING_RESULT_ORDER_IDS_KEY, LANDING_UNLOCKED_ORDER_IDS_KEY, FAV_ORDERS_KEY],
    onKeyChange,
  );
}
