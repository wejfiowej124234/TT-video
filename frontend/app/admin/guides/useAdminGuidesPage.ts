// search-params gate: parent route provides Suspense boundary.
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  ADMIN_GUIDES_STATUS_MAX,
  type AdminGuideRow,
  buildGuidesListPath,
  clampGuideLimit,
  parseGuidesListQuery,
} from "./adminGuidesPageModel";

export function useAdminGuidesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, status, data_origin } = useMemo(
    () => parseGuidesListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.guides({
        limit,
        ...(status ? { status } : {}),
      }),
    [limit, status],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AdminGuideRow>({
      scope: "guides",
      context: "AdminGuidesPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
  }, [limit, status]);

  const filteredItems = useMemo(() => {
    if (!data_origin) return items;
    return items.filter((row) => (row.data_origin ?? "").trim() === data_origin);
  }, [items, data_origin]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const lim = clampGuideLimit(Number.parseInt(draftLimit.trim(), 10));
    const st = draftStatus.trim().slice(0, ADMIN_GUIDES_STATUS_MAX);
    router.push(buildGuidesListPath({ limit: lim, status: st, data_origin }));
  };

  const reset = () => {
    router.push(buildGuidesListPath({ limit: 100, status: "", data_origin: "" }));
  };

  return {
    limit,
    status,
    data_origin,
    loading,
    refreshing,
    error,
    items: filteredItems,
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
