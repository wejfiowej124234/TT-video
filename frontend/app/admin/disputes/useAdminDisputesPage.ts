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
  STATUS_MAX,
  type AdminDispute,
  type AdminDisputesRes,
  buildDisputesListPath,
  clampDisputeLimit,
  parseDisputesListQuery,
} from "./adminDisputesPageModel";

export function useAdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status } = useMemo(
    () => parseDisputesListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminDispute[]>([]);
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

    const headers: Record<string, string> = { "x-request-id": `admin-disputes-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminDisputesRes>(
      "AdminDisputesPage",
      apiUrl(
        routes.admin.disputes({
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
        logAdminFetch("AdminDisputesPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, status]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampDisputeLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, STATUS_MAX);
    router.push(buildDisputesListPath({ limit: lim, status: st }));
  };

  const reset = () => {
    router.push(buildDisputesListPath({ limit: 100, status: "" }));
  };

  return {
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
