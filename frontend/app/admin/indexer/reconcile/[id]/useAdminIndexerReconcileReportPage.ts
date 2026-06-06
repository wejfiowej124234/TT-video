import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import { type ReconcileReportRes } from "./adminIndexerReconcileReportPageModel";

export function useAdminIndexerReconcileReportPage() {
  const params = useParams();
  const reportId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [refreshToken, setRefreshToken] = useState(0);

  const detailUrl = useMemo(
    () => (reportId ? routes.admin.indexerReconcileReport(reportId) : ""),
    [reportId],
  );

  const { body: payload, loading, refreshing, error } = useAdminStandardDetailFetch<ReconcileReportRes>({
    scope: "indexer-reconcile-detail",
    context: "AdminIndexerReconcileReportPage",
    detailUrl,
    resourceId: reportId,
    refreshToken,
  });

  const meta = payload && isAdminMetaRecord(payload.meta) ? payload.meta : null;

  return {
    reportId,
    loading,
    refreshing,
    error,
    payload,
    meta,
    refresh: () => setRefreshToken((n) => n + 1),
  };
}
