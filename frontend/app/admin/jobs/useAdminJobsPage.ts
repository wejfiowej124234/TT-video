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
  type AdminJobRow,
  type AdminJobsRes,
  buildJobsListPath,
  parseJobsListQuery,
} from "./adminJobsPageModel";

export function useAdminJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, status } = useMemo(
    () => parseJobsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [summary, setSummary] = useState<Record<string, number> | null>(null);
  const [items, setItems] = useState<AdminJobRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
  }, [limit, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-jobs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.jobs({
      limit,
      status: status || undefined,
    });

    adminFetchJson<AdminJobsRes>("AdminJobsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setSummary(body.summary && typeof body.summary === "object" ? body.summary : null);
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminJobsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(buildJobsListPath({ limit: nextLimit, status: draftStatus }));
  };

  const clearStatusFilter = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildJobsListPath({ limit: nextLimit, status: "" }));
  };

  const hasStatusFilter = Boolean(status);

  return {
    limit,
    status,
    loading,
    error,
    summary,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    apply,
    clearStatusFilter,
    hasStatusFilter,
  };
}
