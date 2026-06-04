// search-params gate: parent route provides Suspense boundary.
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  type ComplianceEventRow,
  type ComplianceEventsListRes,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<ComplianceEventRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftEventType, setDraftEventType] = useState(eventType);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftEventType(eventType);
  }, [limit, eventType]);

  useEffect(() => {
    if (!requestId) {
      setLoading(false);
      setError(null);
      setItems([]);
      setMeta(null);
      setAppliedFilters(null);
      return;
    }

    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = {
      "x-request-id": `admin-dsar-ev-${requestId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    const path = routes.admin.complianceDataRequestEvents(requestId, {
      limit: effLimit,
      ...(eventType ? { event_type: eventType } : {}),
    });

    adminFetchJson<ComplianceEventsListRes>("AdminComplianceRequestEventsPage", apiUrl(path), { headers })
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
        logAdminFetch("AdminComplianceRequestEventsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [requestId, limit, eventType]);

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
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftEventType,
    setDraftEventType,
    apply,
  };
}
