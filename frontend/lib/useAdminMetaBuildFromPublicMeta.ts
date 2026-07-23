"use client";

import { useEffect, useState } from "react";

import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";

/**
 * 从公开 `GET /meta/build` 取 build 快照，与 Admin 列表响应 `meta.build` 同源（PERF-001：身份探针不打全量 /meta）。
 * 用于无对应列表接口的静态/写操作 Admin 页。
 */
export function useAdminMetaBuildFromPublicMeta(logLabel: string) {
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminFetchJson<unknown>(logLabel, apiUrl(routes.metaBuild), {})
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(`request_failed_${res.status}`);
        }
        // /meta/build is already the build object root (git_sha / deployed_at / …).
        if (!isAdminMetaRecord(body)) return null;
        return { build: body };
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

function isAdminMetaRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
