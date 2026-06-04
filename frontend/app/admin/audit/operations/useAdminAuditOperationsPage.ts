// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";

import {
  type AdminAuditOperationsRes,
  buildOpsListPath,
  clampOpsLimit,
  isAuditOpRow,
  parseOpsListQuery,
} from "./adminAuditOperationsPageModel";

export function useAdminAuditOperationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit } = useMemo(
    () => parseOpsListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<AdminAuditOperationsRes | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(limit));

  useEffect(() => {
    setDraftLimit(String(limit));
  }, [limit]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-ops-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAuditOperationsRes>(
      "AdminAuditOperationsPage",
      apiUrl(routes.admin.auditOperations({ limit })),
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
        logAdminFetch("AdminAuditOperationsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOpsLimit(Number.parseInt(draftLimit.trim(), 10));
    router.push(buildOpsListPath({ limit: lim }));
  };

  const reset = () => {
    router.push(buildOpsListPath({ limit: 50 }));
  };

  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  const operationRows = useMemo(() => {
    const raw = body?.operations;
    if (!Array.isArray(raw)) return [];
    return raw.filter(isAuditOpRow);
  }, [body?.operations]);

  return {
    loading,
    error,
    body,
    meta,
    draftLimit,
    setDraftLimit,
    limit,
    apply,
    reset,
    operationRows,
  };
}
