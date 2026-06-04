import { useEffect, useState } from "react";

import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import type { OverviewBody } from "./observabilityPageModel";

export function useAdminObservabilityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<OverviewBody | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-obs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<OverviewBody>("AdminObservabilityPage", apiUrl(routes.admin.observabilityOverview), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminObservabilityPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, error, body };
}
