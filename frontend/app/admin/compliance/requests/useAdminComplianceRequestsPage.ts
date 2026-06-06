// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  COMPLIANCE_REQUESTS_JURIS_MAX,
  COMPLIANCE_REQUESTS_REF_MAX,
  COMPLIANCE_REQUESTS_SUBJECT_MAX,
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

  const listUrl = useMemo(() => {
    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    return routes.admin.complianceDataRequests({
      limit: effLimit,
      ...(requestRef ? { request_ref: requestRef } : {}),
      ...(subjectId ? { subject_id: subjectId } : {}),
      ...(requestType ? { request_type: requestType } : {}),
      ...(status ? { status } : {}),
      ...(jurisdiction ? { jurisdiction } : {}),
    });
  }, [limit, requestRef, subjectId, requestType, status, jurisdiction]);

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<DsarRow>({
      scope: "compliance-requests",
      context: "AdminComplianceRequestsPage",
      listUrl,
    });

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

  const hasNonLimitFilters =
    Boolean(requestRef) ||
    Boolean(subjectId) ||
    Boolean(requestType) ||
    Boolean(status) ||
    Boolean(jurisdiction);

  return {
    limit,
    requestRef,
    subjectId,
    requestType,
    status,
    jurisdiction,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
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
    hasActiveFilters: hasNonLimitFilters,
  };
}
