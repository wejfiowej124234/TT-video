// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { routes } from "@/lib/api";
import {
  defaultAdminListFetchSnapshot,
  type AdminListFetchSnapshot,
  type AdminStandardListBody,
  useAdminStandardListFetch,
} from "@/lib/admin/useAdminStandardListFetch";

import {
  ADMIN_JOBS_SUMMARY_META_KEY,
  type AdminJobRow,
  type AdminJobsRes,
  buildJobsListPath,
  parseJobsListQuery,
} from "./adminJobsPageModel";

function jobsListToSnapshot(
  body: AdminStandardListBody<AdminJobRow> & Pick<AdminJobsRes, "summary">,
): AdminListFetchSnapshot<AdminJobRow> {
  const base = defaultAdminListFetchSnapshot<AdminJobRow>(body);
  if (body.summary && typeof body.summary === "object") {
    return {
      ...base,
      meta: {
        ...(base.meta ?? {}),
        [ADMIN_JOBS_SUMMARY_META_KEY]: body.summary,
      },
    };
  }
  return base;
}

export function useAdminJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, status } = useMemo(
    () => parseJobsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.jobs({
        limit,
        status: status || undefined,
      }),
    [limit, status],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } = useAdminStandardListFetch<AdminJobRow>({
    scope: "jobs",
    context: "AdminJobsPage",
    listUrl,
    toSnapshot: jobsListToSnapshot,
  });

  const summary = useMemo(() => {
    const raw = meta?.[ADMIN_JOBS_SUMMARY_META_KEY];
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, number>) : null;
  }, [meta]);

  const displayMeta = useMemo(() => {
    if (!meta) return null;
    const { [ADMIN_JOBS_SUMMARY_META_KEY]: _drop, ...rest } = meta;
    return isAdminMetaRecord(rest) && Object.keys(rest).length > 0 ? rest : null;
  }, [meta]);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftStatus, setDraftStatus] = useState(status);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftStatus(status);
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
    refreshing,
    error,
    summary,
    items,
    meta: displayMeta,
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
