"use client";

import { useEffect } from "react";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import type { AdminFlagsListRes, AdminFlagRow } from "./adminFlagsPageTypes";

/** `GET …/admin/flags` 列表（**`reloadTick`** 用于发布成功后刷新）。 */
export function useAdminFlagsPageListFetch(
  limit: number,
  flagCode: string,
  enabled: string,
  scope: string,
  reloadTick: number,
  setLoading: (v: boolean) => void,
  setError: (v: AdminFetchErrorKind | null) => void,
  setItems: (v: AdminFlagRow[]) => void,
  setMeta: (v: Record<string, unknown> | null) => void,
  setAppliedFilters: (v: Record<string, unknown> | null) => void,
) {
  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-flags-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminFlagsListRes>(
      "AdminFlagsPage",
      apiUrl(
        routes.admin.flags({
          limit,
          ...(flagCode ? { flag_code: flagCode } : {}),
          ...(enabled === "true" || enabled === "false" ? { enabled } : {}),
          ...(scope ? { scope } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminFlagsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [
    limit,
    flagCode,
    enabled,
    scope,
    reloadTick,
    setLoading,
    setError,
    setItems,
    setMeta,
    setAppliedFilters,
  ]);
}
