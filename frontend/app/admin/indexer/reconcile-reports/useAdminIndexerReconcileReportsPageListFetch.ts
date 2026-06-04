"use client";

import { useEffect } from "react";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  type ListRes,
  type ProjectionCleanFilter,
} from "./reconcileReportsPageModel";

/** `GET …/admin/indexer/reconcile-reports` 列表拉取。 */
export function useAdminIndexerReconcileReportsPageListFetch(
  limit: number,
  offset: number,
  reportType: string,
  chainIdStr: string,
  projectionClean: ProjectionCleanFilter,
  issuesMinStr: string,
  setLoading: (v: boolean) => void,
  setError: (v: AdminFetchErrorKind | null) => void,
  setData: (v: ListRes | null) => void,
) {
  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-reconcile-reports-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<ListRes>(
      "AdminIndexerReconcileReportsPage",
      apiUrl(
        routes.admin.indexerReconcileReports({
          limit,
          offset,
          ...(reportType ? { report_type: reportType } : {}),
          ...(chainIdStr ? { chain_id: chainIdStr } : {}),
          ...(projectionClean === "true" || projectionClean === "false"
            ? { projection_reconcile_clean: projectionClean === "true" }
            : {}),
          ...(issuesMinStr ? { issues_min: Number.parseInt(issuesMinStr, 10) } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setData)
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerReconcileReportsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [
    limit,
    offset,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
    setLoading,
    setError,
    setData,
  ]);
}
