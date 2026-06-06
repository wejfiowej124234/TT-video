// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import {
  buildAdminAuthAuditEventsPath,
  parseAdminAuthAuditListQuery,
} from "@/lib/adminAuthAuditEventsPath";
import type { AuthAuditEventItem } from "@/lib/apiClient/adminAuthAudit/types";

export function useAdminAuthAuditEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAdminAuthAuditListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.authAuditEvents({
        limit: listQ.limit,
        ...(listQ.event_type ? { event_type: listQ.event_type } : {}),
        ...(listQ.reason ? { reason: listQ.reason } : {}),
        ...(listQ.user_id ? { user_id: listQ.user_id } : {}),
      }),
    [listQ.limit, listQ.event_type, listQ.reason, listQ.user_id],
  );

  const [reloadTick, setReloadTick] = useState(0);

  const { items, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<AuthAuditEventItem>({
      scope: "auth-audit-events",
      context: "AdminAuthAuditEventsPage",
      listUrl,
      refreshToken: reloadTick,
    });

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftEventType, setDraftEventType] = useState(listQ.event_type);
  const [draftReason, setDraftReason] = useState(listQ.reason);
  const [draftUserId, setDraftUserId] = useState(listQ.user_id);

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

  const reload = useCallback(() => {
    setReloadTick((x) => x + 1);
  }, []);

  return {
    listQ,
    loading,
    refreshing,
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
    reload,
  };
}

export type AdminAuthAuditEventsPageViewModel = ReturnType<typeof useAdminAuthAuditEventsPage>;
