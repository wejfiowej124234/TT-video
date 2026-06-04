// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import {
  adminFetchErrorKind,
  type AdminFetchErrorKind,
} from "@/lib/adminFetchDisplay";
import {
  buildAdminAuthAuditEventsPath,
  parseAdminAuthAuditListQuery,
} from "@/lib/adminAuthAuditEventsPath";
import { getAdminAuthAuditEvents, type AuthAuditEventItem } from "@/lib/apiClient/adminAuthAudit";

export function useAdminAuthAuditEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAdminAuthAuditListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AuthAuditEventItem[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftEventType, setDraftEventType] = useState(listQ.event_type);
  const [draftReason, setDraftReason] = useState(listQ.reason);
  const [draftUserId, setDraftUserId] = useState(listQ.user_id);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAuthAuditEvents({
        limit: listQ.limit,
        event_type: listQ.event_type || undefined,
        reason: listQ.reason || undefined,
        user_id: listQ.user_id || undefined,
      });
      setItems(data.items ?? []);
      setAppliedFilters((data.applied_filters as Record<string, unknown>) ?? null);
    } catch (e) {
      setError(adminFetchErrorKind(e));
      setItems([]);
      setAppliedFilters(null);
    } finally {
      setLoading(false);
    }
  }, [listQ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftEventType(listQ.event_type);
    setDraftReason(listQ.reason);
    setDraftUserId(listQ.user_id);
  }, [listQ]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const next = buildAdminAuthAuditEventsPath({
        limit: Number.parseInt(draftLimit, 10) || 50,
        event_type: draftEventType.trim(),
        reason: draftReason.trim(),
        user_id: draftUserId.trim(),
      });
      router.push(next);
    },
    [draftEventType, draftLimit, draftReason, draftUserId, router],
  );

  const reset = useCallback(() => {
    router.push(buildAdminAuthAuditEventsPath({ limit: 50, event_type: "", reason: "", user_id: "" }));
  }, [router]);

  return {
    listQ,
    loading,
    error,
    items,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftEventType,
    setDraftEventType,
    draftReason,
    setDraftReason,
    draftUserId,
    setDraftUserId,
    apply,
    reset,
    reload: load,
  };
}

export type AdminAuthAuditEventsPageViewModel = ReturnType<typeof useAdminAuthAuditEventsPage>;
