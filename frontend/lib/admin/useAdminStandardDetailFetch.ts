"use client";

import { useEffect, useState } from "react";

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

/** 标准 Admin 详情 GET · 命中缓存时保留旧内容 + 后台 refresh（与列表共用 90s 会话缓存）。 */
export function useAdminStandardDetailFetch<TBody>(options: {
  scope: string;
  context: string;
  detailUrl: string;
  resourceId: string;
  refreshToken?: number;
  enabled?: boolean;
}) {
  const {
    scope,
    context,
    detailUrl,
    resourceId,
    refreshToken = 0,
    enabled = true,
  } = options;
  const cacheKey = adminListFetchCacheKey(scope, detailUrl);
  const cached = readAdminListFetchCache<TBody>(cacheKey);

  const [body, setBody] = useState<TBody | null>(cached ?? null);
  const [loading, setLoading] = useState(cached == null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    if (!enabled || !resourceId) {
      setLoading(false);
      setRefreshing(false);
      if (!resourceId) setBody(null);
      return;
    }

    let cancelled = false;
    const warm = readAdminListFetchCache<TBody>(cacheKey);

    if (warm) {
      setBody(warm);
      setLoading(false);
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    void dedupeAdminListFetch(cacheKey, async () => {
      const headers: Record<string, string> = {
        "x-request-id": `${context}-${Date.now()}`,
      };
      try {
        Object.assign(headers, getAuthHeaders());
      } catch {
        /* login_required below */
      }

      const { res, body: json } = await adminFetchJson<TBody & { error?: string }>(
        context,
        apiUrl(detailUrl),
        { headers },
      );
      if (!res.ok) {
        throw new Error(json.error || `request_failed_${res.status}`);
      }
      return json;
    })
      .then((json) => {
        if (cancelled) return;
        writeAdminListFetchCache(cacheKey, json);
        setBody(json);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        logAdminFetch(context, e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, context, detailUrl, enabled, resourceId, refreshToken]);

  return { body, loading, refreshing, error, setBody };
}
