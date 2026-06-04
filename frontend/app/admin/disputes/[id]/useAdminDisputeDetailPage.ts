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

import type { AdminDisputeDetailRes } from "./adminDisputeDetailPageModel";

export function useAdminDisputeDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const disputeId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminDisputeDetailRes | null>(null);

  useEffect(() => {
    if (!disputeId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-dispute-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminDisputeDetailRes>(
      "AdminDisputeDetailPage",
      apiUrl(routes.admin.disputeById(disputeId)),
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
        logAdminFetch("AdminDisputeDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [disputeId]);

  const dispute = body?.dispute && typeof body.dispute === "object" ? body.dispute : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;
  const orderId = typeof dispute?.order_id === "string" ? dispute.order_id : "";

  return { disputeId, loading, error, body, dispute, meta, orderId };
}
