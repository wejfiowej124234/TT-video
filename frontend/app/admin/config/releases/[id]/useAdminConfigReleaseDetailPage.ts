// search-params gate: parent route provides Suspense boundary.
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { releasesListHrefFromRelistParam } from "@/lib/adminConfigReleasesNav";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import type { AdminConfigReleaseDetailRes } from "./adminConfigReleaseDetailPageModel";

export function useAdminConfigReleaseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const releasesListHref = useMemo(
    () => releasesListHrefFromRelistParam(searchParams.get("relist")),
    [searchParams],
  );
  const releaseId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<AdminConfigReleaseDetailRes | null>(null);

  useEffect(() => {
    if (!releaseId) {
      setLoading(false);
      setError(null);
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "x-request-id": `admin-config-release-${releaseId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 below
    }

    adminFetchJson<AdminConfigReleaseDetailRes>(
      "AdminConfigReleaseDetailPage",
      apiUrl(routes.admin.configRelease(releaseId)),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setData)
      .catch((e: unknown) => {
        logAdminFetch("AdminConfigReleaseDetailPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [releaseId]);

  const release = data?.release;
  const meta = data && isAdminMetaRecord(data.meta) ? data.meta : null;

  return { releaseId, releasesListHref, loading, error, data, release, meta };
}
