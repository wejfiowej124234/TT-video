"use client";

import { useEffect, useState } from "react";

import { metaObjectFromGetMetaRoot } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";

/**
 * 从公开 `GET /meta` 取 `build`，与 Admin 列表响应 `meta.build` 同源（health_meta）。
 * 用于无对应列表接口的静态/写操作 Admin 页。
 */
export function useAdminMetaBuildFromPublicMeta(logLabel: string) {
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetchJson<unknown>(logLabel, apiUrl(routes.meta), {})
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        return metaObjectFromGetMetaRoot(body);
      })
      .then(setMeta)
      .catch((e: unknown) => {
        logAdminFetch(logLabel, e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [logLabel]);

  return { meta, loading, error };
}
