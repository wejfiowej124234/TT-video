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
  // HU-418: ignore data_origin query — client filter removed until server-side filter lands
  const { limit, state, id, q } = useMemo(
    () => parseOrdersListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.orders({
        limit,
        ...(state ? { state } : {}),
        ...(id ? { id } : {}),
        ...(q ? { q } : {}),
      }),
    [limit, state, id, q],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AdminOrder>({
      scope: "orders",
      context: "AdminOrdersPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftState, setDraftState] = useState(state);
  const [draftIdQuery, setDraftIdQuery] = useState(id || q);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftState(state);
    setDraftIdQuery(id || q);
  }, [limit, state, id, q]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampOrderLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftState.trim().slice(0, STATE_MAX);
    const needle = draftIdQuery.trim();
    // 完整 UUID → id=；否则 → q= 子串
    const looksUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(needle);
    router.push(
      buildOrdersListPath({
        limit: lim,
        state: st,
        ...(needle
          ? looksUuid
            ? { id: needle }
            : { q: needle }
          : {}),
      }),
    );
  };

  const reset = () => {
    router.push(buildOrdersListPath({ limit: 100, state: "" }));
  };

  return {
    limit,
    state,
    id,
    q,
    loading,
    refreshing,
    error,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftState,
    setDraftState,
    draftIdQuery,
    setDraftIdQuery,
    apply,
    reset,
  };
}
