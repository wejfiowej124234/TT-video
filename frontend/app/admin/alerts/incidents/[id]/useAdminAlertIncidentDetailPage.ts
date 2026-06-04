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

import { type AdminAlertIncidentDetailRes } from "./adminAlertIncidentDetailPageModel";

export function useAdminAlertIncidentDetailPage() {
  const params = useParams();
  const incidentId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminAlertIncidentDetailRes | null>(null);

  useEffect(() => {
    if (!incidentId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-incident-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAlertIncidentDetailRes>(
      "AdminAlertIncidentDetailPage",
      apiUrl(routes.admin.alertIncident(incidentId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminAlertIncidentDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [incidentId]);

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { incidentId, loading, error, body, meta };
}
