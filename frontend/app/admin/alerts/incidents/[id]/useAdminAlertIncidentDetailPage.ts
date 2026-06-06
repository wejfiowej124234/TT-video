import { useParams } from "next/navigation";
import { useMemo } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useAdminStandardDetailFetch } from "@/lib/admin/useAdminStandardDetailFetch";
import { routes } from "@/lib/api";

import { type AdminAlertIncidentDetailRes } from "./adminAlertIncidentDetailPageModel";

export function useAdminAlertIncidentDetailPage() {
  const params = useParams();
  const incidentId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const detailUrl = useMemo(
    () => (incidentId ? routes.admin.alertIncident(incidentId) : ""),
    [incidentId],
  );

  const { body, loading, refreshing, error } = useAdminStandardDetailFetch<AdminAlertIncidentDetailRes>({
    scope: "alert-incident-detail",
    context: "AdminAlertIncidentDetailPage",
    detailUrl,
    resourceId: incidentId,
  });

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { incidentId, loading, refreshing, error, body, meta };
}
