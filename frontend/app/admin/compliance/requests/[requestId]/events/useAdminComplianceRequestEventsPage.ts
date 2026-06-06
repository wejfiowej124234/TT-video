// search-params gate: parent route provides Suspense boundary.
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  type ComplianceEventRow,
  COMPLIANCE_EVENTS_EVENT_TYPE_MAX,
  buildComplianceEventsPath,
  parseComplianceEventsQuery,
} from "./adminComplianceRequestEventsPageModel";

export function useAdminComplianceRequestEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const requestId = useMemo(() => {
    const raw = params?.requestId;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const { limit, eventType } = useMemo(
    () => parseComplianceEventsQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(() => {
    if (!requestId) return "";
    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    return routes.admin.complianceDataRequestEvents(requestId, {
      limit: effLimit,
      ...(eventType ? { event_type: eventType } : {}),
    });
  }, [requestId, limit, eventType]);

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<ComplianceEventRow>({
      scope: "compliance-request-events",
      context: "AdminComplianceRequestEventsPage",
      listUrl,
      enabled: Boolean(requestId),
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftEventType, setDraftEventType] = useState(eventType);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftEventType(eventType);
  }, [limit, eventType]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    if (!requestId) return;
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildComplianceEventsPath(requestId, {
        limit: nextLimit,
        eventType: draftEventType.trim().slice(0, COMPLIANCE_EVENTS_EVENT_TYPE_MAX),
      }),
    );
  };

  return {
    requestId,
    limit,
    eventType,
    loading: requestId ? loading : false,
    refreshing,
    error: requestId ? error : null,
    items: requestId ? items : [],
    meta: requestId ? meta : null,
    appliedFilters: requestId ? appliedFilters : null,
    draftLimit,
    setDraftLimit,
    draftEventType,
    setDraftEventType,
    apply,
  };
}
