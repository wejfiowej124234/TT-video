/** ① Admin 列表/详情 JSON 内存缓存 · stale-while-revalidate（会话内 · 非跨设备 SSOT）。 */
export const ADMIN_LIST_FETCH_CACHE_TTL_MS = 90_000;
export const ADMIN_LIST_FETCH_CACHE_MAX_ENTRIES = 48;

type CacheEntry = { data: unknown; at: number };

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function pruneCacheIfNeeded(): void {
  while (cache.size > ADMIN_LIST_FETCH_CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

export function adminListFetchCacheKey(scope: string, url: string): string {
  return `${scope}::${url}`;
}

export function readAdminListFetchCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > ADMIN_LIST_FETCH_CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function writeAdminListFetchCache<T>(key: string, data: T): void {
  pruneCacheIfNeeded();
  cache.set(key, { data, at: Date.now() });
}

export function invalidateAdminListFetchCache(scopePrefix?: string): void {
  if (!scopePrefix) {
    cache.clear();
    inflight.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(scopePrefix)) cache.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(scopePrefix)) inflight.delete(key);
  }
}

export async function dedupeAdminListFetch<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

/** @internal vitest */
export function resetAdminListFetchCacheForTests(): void {
  cache.clear();
  inflight.clear();
}
