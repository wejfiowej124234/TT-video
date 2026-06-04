// search-params gate: parent route provides Suspense boundary.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { buildAdminAuditLogsPath, clampAdminAuditLimit } from "@/lib/adminAuditLogsPath";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import type { AdminAuditLog, AdminAuditLogsRes } from "./adminAuditPageTypes";
import { parseAuditListQuery } from "./adminAuditPageQuery";

export type AdminAuditPageViewModel = {
  listQ: ReturnType<typeof parseAuditListQuery>;
  loading: boolean;
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<AdminAuditLog[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

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

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNote(null);
    setMeta(null);

    const headers: Record<string, string> = { "x-request-id": `admin-audit-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<AdminAuditLogsRes>(
      "AdminAuditPage",
      apiUrl(
        routes.admin.auditLogs({
          limit: listQ.limit,
          ...(listQ.actor_id ? { actor_id: listQ.actor_id } : {}),
          ...(listQ.action ? { action: listQ.action } : {}),
          ...(listQ.resource_type ? { resource_type: listQ.resource_type } : {}),
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
        setNote(typeof body.note === "string" ? body.note : null);
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminAuditPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
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
