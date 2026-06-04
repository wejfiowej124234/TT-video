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

import type { AdminGuideDetailRes } from "./adminGuideDetailPageModel";

export function useAdminGuideDetailPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "";
  const guideId = decodeURIComponent(rawId.trim());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminGuideDetailRes | null>(null);

  useEffect(() => {
    if (!guideId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-guide-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminGuideDetailRes>(
      "AdminGuideDetailPage",
      apiUrl(routes.admin.guideById(guideId)),
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
        logAdminFetch("AdminGuideDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [guideId]);

  const guide = body?.guide && typeof body.guide === "object" ? body.guide : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return { guideId, loading, error, body, guide, meta };
}
