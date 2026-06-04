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
import { isUuidString } from "@/lib/isUuidString";

import {
  APPEAL_STATUS_URL,
  type CommunityAppealRow,
  type CommunityAppealsRes,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<CommunityAppealRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftReportId, setDraftReportId] = useState(listQ.reportId);
  const [draftStatus, setDraftStatus] = useState(listQ.status);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftReportId(listQ.reportId);
    setDraftStatus(listQ.status);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-appeals-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.communityAppeals({
      limit: listQ.limit,
      report_id: listQ.reportId || undefined,
      status: listQ.status || undefined,
    });

    adminFetchJson<CommunityAppealsRes>("AdminCommunityAppealsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setItems(Array.isArray(body.items) ? body.items : []);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminCommunityAppealsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
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
