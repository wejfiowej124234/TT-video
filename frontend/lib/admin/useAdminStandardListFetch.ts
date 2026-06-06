"use client";

import { useEffect, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  adminListFetchCacheKey,
  dedupeAdminListFetch,
  readAdminListFetchCache,
  writeAdminListFetchCache,
} from "@/lib/admin/adminListFetchCache";

export type AdminStandardListBody<TItem> = {
  items?: TItem[] | unknown;
  applied_filters?: Record<string, unknown> | null;
  meta?: Record<string, unknown>;
  error?: string;
  note?: string;
};

export type AdminListFetchSnapshot<TItem> = {
  items: TItem[];
  appliedFilters: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  itemsMalformed?: boolean;
};

export function defaultAdminListFetchSnapshot<TItem>(
  body: AdminStandardListBody<TItem>,
): AdminListFetchSnapshot<TItem> {
  const rawItems = body.items;
  if (rawItems == null) {
    return {
      items: [],
      appliedFilters: body.applied_filters ?? null,
      meta: isAdminMetaRecord(body.meta) ? body.meta : null,
      itemsMalformed: false,
    };
  }
  if (!Array.isArray(rawItems)) {
    if (typeof window !== "undefined") {
      console.error("AdminListFetch: items is not an array", rawItems);
    }
    return {
      items: [],
      appliedFilters: body.applied_filters ?? null,
      meta: isAdminMetaRecord(body.meta) ? body.meta : null,
      itemsMalformed: true,
    };
  }
  return {
    items: rawItems,
    appliedFilters: body.applied_filters ?? null,
    meta: isAdminMetaRecord(body.meta) ? body.meta : null,
    itemsMalformed: false,
  };
}

/** 标准 `{ items, applied_filters, meta }` 列表 · 命中缓存时保留旧表 + 后台刷新。 */
export function useAdminStandardListFetch<TItem>(options: {
  scope: string;
  context: string;
  listUrl: string;
  refreshToken?: number;
  enabled?: boolean;
  toSnapshot?: (body: AdminStandardListBody<TItem>) => AdminListFetchSnapshot<TItem>;
}) {
  const {
    scope,
    context,
    listUrl,
    refreshToken = 0,
    enabled = true,
    toSnapshot = defaultAdminListFetchSnapshot,
  } = options;
  const cacheKey = adminListFetchCacheKey(scope, listUrl);
  const cached = readAdminListFetchCache<AdminListFetchSnapshot<TItem>>(cacheKey);

  const [items, setItems] = useState<TItem[]>(cached?.items ?? []);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(
    cached?.appliedFilters ?? null,
  );
  const [meta, setMeta] = useState<Record<string, unknown> | null>(cached?.meta ?? null);
  const [itemsMalformed, setItemsMalformed] = useState(cached?.itemsMalformed ?? false);
  const [loading, setLoading] = useState(cached == null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [staleWhileError, setStaleWhileError] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const warm = readAdminListFetchCache<AdminListFetchSnapshot<TItem>>(cacheKey);

    if (warm) {
      setItems(warm.items);
      setAppliedFilters(warm.appliedFilters);
      setMeta(warm.meta);
      setItemsMalformed(Boolean(warm.itemsMalformed));
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setStaleWhileError(false);

    void dedupeAdminListFetch(cacheKey, async () => {
      const headers: Record<string, string> = {
        "x-request-id": `${context}-${Date.now()}`,
      };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        /* login_required below */
      }

      const { res, body } = await adminFetchJson<AdminStandardListBody<TItem>>(
        context,
        apiUrl(listUrl),
        { headers },
      );
      if (!res.ok) {
        throw new Error(body.error || `request_failed_${res.status}`);
      }
      return toSnapshot(body);
    })
      .then((snapshot) => {
        if (cancelled) return;
        writeAdminListFetchCache(cacheKey, snapshot);
        setItems(snapshot.items);
        setAppliedFilters(snapshot.appliedFilters);
        setMeta(snapshot.meta);
        setItemsMalformed(Boolean(snapshot.itemsMalformed));
        setStaleWhileError(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        logAdminFetch(context, e);
        setError(adminFetchErrorKind(e));
        if (!warm) {
          setItems([]);
          setAppliedFilters(null);
          setMeta(null);
          setItemsMalformed(false);
          setStaleWhileError(false);
        } else {
          setStaleWhileError(true);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, context, listUrl, enabled, refreshToken, toSnapshot]);

  return {
    items,
    appliedFilters,
    meta,
    itemsMalformed,
    loading,
    refreshing,
    error,
    staleWhileError,
    setItems,
  };
}
