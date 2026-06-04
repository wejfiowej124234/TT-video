import { useEffect, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import type { IndexerHealthRes } from "./indexerPageModel";

export function useAdminIndexerPage(refreshTick: number) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-indexer-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<IndexerHealthRes>("AdminIndexerPage", apiUrl(routes.admin.indexerHealth), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then((json) => {
        setHealth((json.health as Record<string, unknown> | undefined) ?? null);
        setMeta(isAdminMetaRecord(json.meta) ? json.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [refreshTick]);

  return { loading, error, health, meta };
}
