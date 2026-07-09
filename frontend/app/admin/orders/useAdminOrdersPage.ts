// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  STATE_MAX,
  type AdminOrder,
  buildOrdersListPath,
  clampOrderLimit,
  parseOrdersListQuery,
} from "./adminOrdersPageModel";

export function useAdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, state, data_origin } = useMemo(
    () => parseOrdersListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.orders({
        limit,
        ...(state ? { state } : {}),
      }),
    [limit, state],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AdminOrder>({
      scope: "orders",
      context: "AdminOrdersPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftState, setDraftState] = useState(state);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftState(state);
  }, [limit, state]);

  const filteredItems = useMemo(() => {
    if (!data_origin) return items;
    return items.filter((row) => (row.data_origin ?? "").trim() === data_origin);
  }, [items, data_origin]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOrderLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftState.trim().slice(0, STATE_MAX);
    router.push(buildOrdersListPath({ limit: lim, state: st, data_origin }));
  };

  const reset = () => {
    router.push(buildOrdersListPath({ limit: 100, state: "", data_origin: "" }));
  };

  return {
    limit,
    state,
    data_origin,
    loading,
    refreshing,
    error,
    items: filteredItems,
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
