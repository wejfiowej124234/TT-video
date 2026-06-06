// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { buildAdminAuditLogsPath, clampAdminAuditLimit } from "@/lib/adminAuditLogsPath";
import { routes } from "@/lib/api";
import {
  defaultAdminListFetchSnapshot,
  useAdminStandardListFetch,
  type AdminStandardListBody,
} from "@/lib/admin/useAdminStandardListFetch";
import type { AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { AdminAuditLog } from "./adminAuditPageTypes";
import { parseAuditListQuery } from "./adminAuditPageQuery";

function auditListSnapshot(body: AdminStandardListBody<AdminAuditLog>) {
  const snap = defaultAdminListFetchSnapshot(body);
  const metaNote = snap.meta && typeof snap.meta.note === "string" ? snap.meta.note : null;
  const note = metaNote ?? (typeof body.note === "string" ? body.note : null);
  if (!note) return snap;
  return {
    ...snap,
    meta: snap.meta ? { ...snap.meta, note } : { note },
  };
}

export type AdminAuditPageViewModel = {
  listQ: ReturnType<typeof parseAuditListQuery>;
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  items: AdminAuditLog[];
  note: string | null;
  meta: Record<string, unknown> | null;
  appliedFilters: Record<string, unknown> | null;
  draftLimit: string;
  setDraftLimit: (v: string) => void;
  draftActorId: string;
  setDraftActorId: (v: string) => void;
  draftAction: string;
  setDraftAction: (v: string) => void;
  draftResourceType: string;
  setDraftResourceType: (v: string) => void;
  apply: (e?: FormEvent) => void;
  reset: () => void;
};

export function useAdminAuditPage(): AdminAuditPageViewModel {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseAuditListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.auditLogs({
        limit: listQ.limit,
        ...(listQ.actor_id ? { actor_id: listQ.actor_id } : {}),
        ...(listQ.action ? { action: listQ.action } : {}),
        ...(listQ.resource_type ? { resource_type: listQ.resource_type } : {}),
      }),
    [listQ.limit, listQ.actor_id, listQ.action, listQ.resource_type],
  );

  const { items, appliedFilters, meta, loading, refreshing, error } =
    useAdminStandardListFetch<AdminAuditLog>({
      scope: "audit-logs",
      context: "AdminAuditPage",
      listUrl,
      toSnapshot: auditListSnapshot,
    });

  const note = useMemo(() => {
    if (meta && typeof meta.note === "string") return meta.note;
    return null;
  }, [meta]);

  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftActorId, setDraftActorId] = useState(listQ.actor_id);
  const [draftAction, setDraftAction] = useState(listQ.action);
  const [draftResourceType, setDraftResourceType] = useState(listQ.resource_type);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftActorId(listQ.actor_id);
    setDraftAction(listQ.action);
    setDraftResourceType(listQ.resource_type);
  }, [listQ.limit, listQ.actor_id, listQ.action, listQ.resource_type]);

  const apply = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const lim = clampAdminAuditLimit(Number.parseInt(draftLimit.trim(), 10));
      router.push(
        buildAdminAuditLogsPath({
          limit: lim,
          actor_id: draftActorId,
          action: draftAction,
          resource_type: draftResourceType,
        }),
      );
    },
    [router, draftLimit, draftActorId, draftAction, draftResourceType],
  );

  const reset = useCallback(() => {
    router.push(buildAdminAuditLogsPath({ limit: 50, actor_id: "", action: "", resource_type: "" }));
  }, [router]);

  return {
    listQ,
    loading,
    refreshing,
    error,
    items,
    note,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftActorId,
    setDraftActorId,
    draftAction,
    setDraftAction,
    draftResourceType,
    setDraftResourceType,
    apply,
    reset,
  };
}
