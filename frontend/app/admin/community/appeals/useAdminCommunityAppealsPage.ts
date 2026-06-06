// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { isUuidString } from "@/lib/isUuidString";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  APPEAL_STATUS_URL,
  type CommunityAppealRow,
  buildAppealsListPath,
  parseAppealsListQuery,
} from "./adminCommunityAppealsPageModel";

export function useAdminCommunityAppealsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAppealsListQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.communityAppeals({
        limit: listQ.limit,
        report_id: listQ.reportId || undefined,
        status: listQ.status || undefined,
      }),
    [listQ.limit, listQ.reportId, listQ.status],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<CommunityAppealRow>({
      scope: "community-appeals",
      context: "AdminCommunityAppealsPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftStatus, setDraftStatus] = useState(listQ.status);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftReportId(listQ.reportId);
    setDraftStatus(listQ.status);
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const rTrim = draftReportId.trim();
    const nextRep = isUuidString(rTrim) ? rTrim : "";
    router.push(
      buildAppealsListPath({
        limit: nextLimit,
        reportId: nextRep,
        status: APPEAL_STATUS_URL.has(draftStatus) ? draftStatus : "",
      }),
    );
  };

  const resetFilters = () => {
    router.push(buildAppealsListPath({ limit: 50, reportId: "", status: "" }));
  };

  return {
    listQ,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftReportId,
    setDraftReportId,
    draftStatus,
    setDraftStatus,
    apply,
    resetFilters,
  };
}
