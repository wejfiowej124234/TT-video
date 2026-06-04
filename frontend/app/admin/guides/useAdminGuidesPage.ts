// search-params gate: parent route provides Suspense boundary.
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
  ADMIN_GUIDES_STATUS_MAX,
  type AdminGuideRow,
  type AdminGuidesRes,
  buildGuidesListPath,
  clampGuideLimit,
  parseGuidesListQuery,
} from "./adminGuidesPageModel";

export function useAdminGuidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status } = useMemo(
    () => parseGuidesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminGuideRow[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
  }, [limit, status]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-guides-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminGuidesRes>(
      "AdminGuidesPage",
      apiUrl(
        routes.admin.guides({
          limit,
          ...(status ? { status } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminGuidesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampGuideLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
    router.push(buildGuidesListPath({ limit: lim, status: st }));
  };

  const reset = () => {
    router.push(buildGuidesListPath({ limit: 100, status: "" }));
  };

  return {
    limit,
    status,
    loading,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftStatus,
    setDraftStatus,
    apply,
    reset,
  };
}
