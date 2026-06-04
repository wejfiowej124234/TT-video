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
  STATE_MAX,
  type AdminOrder,
  type AdminOrdersRes,
  buildOrdersListPath,
  clampOrderLimit,
  parseOrdersListQuery,
} from "./adminOrdersPageModel";

export function useAdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, state } = useMemo(
    () => parseOrdersListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminOrder[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftState, setDraftState] = useState(state);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftState(state);
  }, [limit, state]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-orders-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminOrdersRes>(
      "AdminOrdersPage",
      apiUrl(
        routes.admin.orders({
          limit,
          ...(state ? { state } : {}),
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
        logAdminFetch("AdminOrdersPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, state]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOrderLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftState.trim().slice(0, STATE_MAX);
    router.push(buildOrdersListPath({ limit: lim, state: st }));
  };

  const reset = () => {
    router.push(buildOrdersListPath({ limit: 100, state: "" }));
  };

  return {
    limit,
    state,
    loading,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftState,
    setDraftState,
    apply,
    reset,
  };
}
