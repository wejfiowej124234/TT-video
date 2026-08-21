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
  parseAdminQueueInventoryTotal,
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
} from "@/lib/admin/useAdminStandardListFetch";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

export type AdminQueueListResult<T extends { items?: unknown[] }> = {
  items: T["items"];
  errorKind: AdminFetchErrorKind | null;
  rateLimited?: boolean;
  /** Authoritative inventory total when API provided it; null = unknown / fail-closed. */
  total: number | null;
  /** List `meta.source` when present (postgres / memory / …). */
  source: string | null;
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
    const warm = readAdminListFetchCache<AdminListFetchSnapshot<unknown>>(cacheKey);
    if (warm?.items) {
      return {
        items: warm.items as T["items"],
        errorKind: null,
        total: parseAdminQueueInventoryTotal({ total: warm.total }),
        source: readListMetaSource(warm.meta),
      };
    }
    return dedupeAdminListFetch(cacheKey, () =>
      fetchAdminQueueListOnce<T>(context, listUrl, cacheKey),
    );
  }

  return fetchAdminQueueListOnce<T>(context, listUrl, null);
}

function readListMetaSource(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta || typeof meta !== "object") return null;
  const source = meta.source;
  return typeof source === "string" && source.trim() ? source.trim() : null;
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
    return { items: [] as T["items"], errorKind: "login_required", total: null, source: null };
  }

  try {
    const { res, body } = await adminFetchJson<T & { total?: unknown }>(context, apiUrl(listUrl), {
      headers,
    });
    if (!res.ok) {
      throw new Error((body as { error?: string })?.error || `request_failed_${res.status}`);
    }
    const items = Array.isArray(body.items) ? body.items : [];
    const total = parseAdminQueueInventoryTotal(body);
    if (cacheKey) {
      writeAdminListFetchCache(
        cacheKey,
        defaultAdminListFetchSnapshot(body as AdminStandardListBody<never>),
      );
    }
    return { items, errorKind: null, total, source: readListMetaSource((body as AdminStandardListBody<never>).meta) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logAdminFetch(context, e);
    return {
      items: [] as T["items"],
      errorKind: adminFetchErrorKind(e),
      rateLimited: msg === "rate_limit_exceeded",
      total: null,
      source: null,
    };
  }
}
