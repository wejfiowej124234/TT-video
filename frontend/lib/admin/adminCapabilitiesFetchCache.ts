/** ① Admin capabilities 会话内存缓存 · stale-while-revalidate（与列表 cache 同源 TTL）。 */

export const ADMIN_CAPABILITIES_FETCH_CACHE_TTL_MS = 90_000;



export type AdminCapabilitiesCachePayload = {

  role: string | null;

  consoleRole70: string | null;

  consoleRoleSource: string | null;

  permissions: string[];

  matrixVersion: string | null;

  roleMatrixPreview: Record<string, string[]> | null;

  phase2Prep: Record<string, unknown> | null;

};



type CacheEntry = { data: AdminCapabilitiesCachePayload; at: number };



let cache: CacheEntry | null = null;

let inflight: Promise<AdminCapabilitiesCachePayload | null> | null = null;



export function readAdminCapabilitiesFetchCache(): AdminCapabilitiesCachePayload | null {

  if (!cache) return null;

  if (Date.now() - cache.at > ADMIN_CAPABILITIES_FETCH_CACHE_TTL_MS) {

    cache = null;

    return null;

  }

  return cache.data;

}



export function writeAdminCapabilitiesFetchCache(data: AdminCapabilitiesCachePayload): void {

  cache = { data, at: Date.now() };

}



export function invalidateAdminCapabilitiesFetchCache(): void {

  cache = null;

  inflight = null;

}



export async function dedupeAdminCapabilitiesFetch<T>(

  run: () => Promise<T>,

): Promise<T> {

  if (inflight) return inflight as Promise<T>;

  const promise = run().finally(() => {

    inflight = null;

  });

  inflight = promise as Promise<AdminCapabilitiesCachePayload | null>;

  return promise;

}



/** @internal vitest */

export function resetAdminCapabilitiesFetchCacheForTests(): void {

  cache = null;

  inflight = null;

}


