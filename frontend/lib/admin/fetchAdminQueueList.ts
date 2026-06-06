import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import {
  adminListFetchCacheKey,
  dedupeAdminListFetch,
  readAdminListFetchCache,
  writeAdminListFetchCache,
} from "@/lib/admin/adminListFetchCache";
import {
  defaultAdminListFetchSnapshot,
  type AdminStandardListBody,
} from "@/lib/admin/useAdminStandardListFetch";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

export type AdminQueueListResult<T extends { items?: unknown[] }> = {
  items: T["items"];
  errorKind: AdminFetchErrorKind | null;
  rateLimited?: boolean;
};

export type AdminQueueListFetchOptions = {
  /** 与 `useAdminStandardListFetch` 同源 scope · 命中 90s SWR 缓存时跳过网络。 */
  scope?: string;
};

export async function fetchAdminQueueList<T extends { items?: unknown[] }>(
  context: string,
  listUrl: string,
  options?: AdminQueueListFetchOptions,
): Promise<AdminQueueListResult<T>> {
  const cacheKey = options?.scope ? adminListFetchCacheKey(options.scope, listUrl) : null;

  if (cacheKey) {
    const warm = readAdminListFetchCache<{ items: unknown[] }>(cacheKey);
    if (warm?.items) {
      return { items: warm.items as T["items"], errorKind: null };
    }
    return dedupeAdminListFetch(cacheKey, () =>
      fetchAdminQueueListOnce<T>(context, listUrl, cacheKey),
    );
  }

  return fetchAdminQueueListOnce<T>(context, listUrl, null);
}

async function fetchAdminQueueListOnce<T extends { items?: unknown[] }>(
  context: string,
  listUrl: string,
  cacheKey: string | null,
): Promise<AdminQueueListResult<T>> {
  const headers: Record<string, string> = { "x-request-id": `${context}-${Date.now()}` };
  try {
    Object.assign(headers, getAuthHeaders());
  } catch {
    return { items: [], errorKind: "login_required" };
  }

  try {
    const { res, body } = await adminFetchJson<T>(context, apiUrl(listUrl), { headers });
    if (!res.ok) {
      throw new Error((body as { error?: string })?.error || `request_failed_${res.status}`);
    }
    const items = Array.isArray(body.items) ? body.items : [];
    if (cacheKey) {
      writeAdminListFetchCache(
        cacheKey,
        defaultAdminListFetchSnapshot(body as AdminStandardListBody<never>),
      );
    }
    return { items, errorKind: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logAdminFetch(context, e);
    return {
      items: [],
      errorKind: adminFetchErrorKind(e),
      rateLimited: msg === "rate_limit_exceeded",
    };
  }
}
