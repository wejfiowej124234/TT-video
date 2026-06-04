import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import { type ReconcileReportRes } from "./adminIndexerReconcileReportPageModel";

export function useAdminIndexerReconcileReportPage() {
  const params = useParams();
  const reportId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [payload, setPayload] = useState<ReconcileReportRes | null>(null);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      setError(null);
      setPayload(null);
      return;
    }

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "x-request-id": `admin-reconcile-${reportId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    const path = routes.admin.indexerReconcileReport(reportId);

    adminFetchJson<ReconcileReportRes>("AdminIndexerReconcileReportPage", apiUrl(path), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setPayload)
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerReconcileReportPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [reportId, refreshTick]);

  const meta = payload && isAdminMetaRecord(payload.meta) ? payload.meta : null;

  return {
    reportId,
    loading,
    error,
    payload,
    meta,
    refresh: () => setRefreshTick((n) => n + 1),
  };
}
