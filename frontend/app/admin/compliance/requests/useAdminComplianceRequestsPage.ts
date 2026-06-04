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
  COMPLIANCE_REQUESTS_JURIS_MAX,
  COMPLIANCE_REQUESTS_REF_MAX,
  COMPLIANCE_REQUESTS_SUBJECT_MAX,
  type ComplianceRequestsListRes,
  type DsarRow,
  buildComplianceRequestsListPath,
  normalizeComplianceRequestTypeUrl,
  normalizeComplianceStatusUrl,
  parseComplianceRequestsListQuery,
} from "./adminComplianceRequestsPageModel";

export function useAdminComplianceRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, requestRef, subjectId, requestType, status, jurisdiction } = useMemo(
    () => parseComplianceRequestsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<DsarRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftRequestRef, setDraftRequestRef] = useState(requestRef);
  const [draftSubjectId, setDraftSubjectId] = useState(subjectId);
  const [draftRequestType, setDraftRequestType] = useState(requestType);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftJurisdiction, setDraftJurisdiction] = useState(jurisdiction);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftRequestRef(requestRef);
    setDraftSubjectId(subjectId);
    setDraftRequestType(requestType);
    setDraftStatus(status);
    setDraftJurisdiction(jurisdiction);
  }, [limit, requestRef, subjectId, requestType, status, jurisdiction]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-dsar-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<ComplianceRequestsListRes>(
      "AdminComplianceRequestsPage",
      apiUrl(
        routes.admin.complianceDataRequests({
          limit: effLimit,
          ...(requestRef ? { request_ref: requestRef } : {}),
          ...(subjectId ? { subject_id: subjectId } : {}),
          ...(requestType ? { request_type: requestType } : {}),
          ...(status ? { status } : {}),
          ...(jurisdiction ? { jurisdiction } : {}),
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
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
        setAppliedFilters(body.applied_filters ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminComplianceRequestsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, requestRef, subjectId, requestType, status, jurisdiction]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const nextType = normalizeComplianceRequestTypeUrl(draftRequestType);
    const nextStatus = normalizeComplianceStatusUrl(draftStatus);
    router.push(
      buildComplianceRequestsListPath({
        limit: nextLimit,
        requestRef: draftRequestRef.trim().slice(0, COMPLIANCE_REQUESTS_REF_MAX),
        subjectId: draftSubjectId.trim().slice(0, COMPLIANCE_REQUESTS_SUBJECT_MAX),
        requestType: nextType,
        status: nextStatus,
        jurisdiction: draftJurisdiction.trim().slice(0, COMPLIANCE_REQUESTS_JURIS_MAX),
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildComplianceRequestsListPath({
        limit: nextLimit,
        requestRef: "",
        subjectId: "",
        requestType: "",
        status: "",
        jurisdiction: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(requestRef) ||
    Boolean(subjectId) ||
    Boolean(requestType) ||
    Boolean(status) ||
    Boolean(jurisdiction);

  return {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    limit,
    requestRef,
    subjectId,
    requestType,
    status,
    jurisdiction,
    draftLimit,
    setDraftLimit,
    draftRequestRef,
    setDraftRequestRef,
    draftSubjectId,
    setDraftSubjectId,
    draftRequestType,
    setDraftRequestType,
    draftStatus,
    setDraftStatus,
    draftJurisdiction,
    setDraftJurisdiction,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}
