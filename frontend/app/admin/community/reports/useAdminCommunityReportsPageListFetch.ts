"use client";

import { useEffect } from "react";
import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import type { ReportRow, ReportsListParsed, ReportsRes } from "./adminCommunityReportsTypes";

/** `GET …/admin/community/reports` 列表拉取（**`reloadTick`** 用于审核成功后刷新）。 */
export function useAdminCommunityReportsPageListFetch(
  listQ: ReportsListParsed,
  reloadTick: number,
  setLoading: (v: boolean) => void,
  setError: (v: AdminFetchErrorKind | null) => void,
  setItems: (v: ReportRow[]) => void,
  setMeta: (v: Record<string, unknown> | null) => void,
  setAppliedFilters: (v: Record<string, unknown> | null) => void,
) {
  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const limit = listQ.limit;

    const headers: Record<string, string> = { "x-request-id": `admin-community-reports-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    const path = routes.admin.communityReports({
      limit,
      ...(listQ.status ? { status: listQ.status } : {}),
      ...(listQ.reporterId ? { reporter_id: listQ.reporterId } : {}),
      ...(listQ.targetType ? { target_type: listQ.targetType } : {}),
      ...(listQ.reasonCode ? { reason_code: listQ.reasonCode } : {}),
      ...(listQ.targetId ? { target_id: listQ.targetId } : {}),
    });

    adminFetchJson<ReportsRes>("AdminCommunityReportsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminCommunityReportsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ, reloadTick, setLoading, setError, setItems, setMeta, setAppliedFilters]);
}
