import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import type { AdminAcquisitionPublishSuspendSnapshot } from "@/components/admin/AdminAcquisitionPublishSuspendCard";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import { type AdminUserDetailRes } from "./adminUserDetailPageModel";

export function useAdminUserDetailPage() {
  const params = useParams();
  const userId = useMemo(() => {
    const raw = typeof params?.id === "string" ? params.id : "";
    return decodeURIComponent(raw.trim());
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminUserDetailRes | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setBody(null);
      return;
    }
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-user-detail-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminUserDetailRes>("AdminUserDetailPage", apiUrl(routes.admin.userById(userId)), { headers })
      .then(({ res, body: json }) => {
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminUserDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const user = body?.user && typeof body.user === "object" ? body.user : null;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const acquisitionSuspendInitial: AdminAcquisitionPublishSuspendSnapshot | null = useMemo(() => {
    if (!user) return null;
    if (typeof user.acquisition_publish_suspended !== "boolean") return null;
    const until = user.acquisition_publish_suspended_until;
    return {
      acquisition_publish_suspended: user.acquisition_publish_suspended,
      acquisition_publish_suspended_until:
        typeof until === "string" ? until : until === null ? null : undefined,
    };
  }, [user]);

  return { userId, loading, error, user, meta, acquisitionSuspendInitial };
}
