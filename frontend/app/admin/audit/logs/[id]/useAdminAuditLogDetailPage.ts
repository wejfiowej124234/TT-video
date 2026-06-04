import { useParams } from "next/navigation";
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

import type { AdminAuditLogDetailRes } from "./adminAuditLogDetailPageModel";

export function useAdminAuditLogDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const logId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminAuditLogDetailRes | null>(null);

  useEffect(() => {
    if (!logId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAuditLogDetailRes>(
      "AdminAuditLogDetailPage",
      apiUrl(routes.admin.auditLogById(logId)),
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
        logAdminFetch("AdminAuditLogDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [logId]);

  const row = body?.audit_log && typeof body.audit_log === "object" ? body.audit_log : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { logId, loading, error, body, row, meta };
}
