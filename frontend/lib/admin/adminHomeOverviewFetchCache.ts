/** ① Admin 首页系统概况 · 会话内内存缓存（90s · 非跨设备 SSOT）。 */
import { ADMIN_LIST_FETCH_CACHE_TTL_MS } from "@/lib/admin/adminListFetchCache";

import type {
  AdminHomeMetricsOverview,
  AdminHomeObservabilityLite,
  AdminHomeUserSnapshot,
} from "./adminHomeSystemOverviewMetrics";

export type AdminHomeOverviewCacheSnapshot = {
  metrics: AdminHomeMetricsOverview | null;
  metricsDenied: boolean;
  metricsError: boolean;
  users: AdminHomeUserSnapshot | null;
  usersDenied: boolean;
  usersError: boolean;
  observability: AdminHomeObservabilityLite | null;
  observabilityDenied: boolean;
  observabilityError: boolean;
};

const CACHE_KEY = "admin-home-overview-v1";
let cache: { data: AdminHomeOverviewCacheSnapshot; at: number } | null = null;

export function readAdminHomeOverviewCache(): AdminHomeOverviewCacheSnapshot | null {
  if (!cache) return null;
  if (Date.now() - cache.at > ADMIN_LIST_FETCH_CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.data;
}

export function writeAdminHomeOverviewCache(data: AdminHomeOverviewCacheSnapshot): void {
  cache = { data, at: Date.now() };
}

export function invalidateAdminHomeOverviewCache(): void {
  cache = null;
}

/** @internal vitest */
export function resetAdminHomeOverviewCacheForTests(): void {
  cache = null;
}

export const ADMIN_HOME_OVERVIEW_CACHE_KEY = CACHE_KEY;
