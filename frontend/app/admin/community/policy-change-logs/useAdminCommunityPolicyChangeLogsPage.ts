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
  SOURCE_MAX,
  SCOPE_MAX,
  SUMMARY_MAX,
  type PolicyChangeLogRow,
  type PolicyChangeLogsRes,
  buildPolicyLogsPath,
  parsePolicyLogsQuery,
} from "./adminCommunityPolicyChangeLogsPageModel";

export function useAdminCommunityPolicyChangeLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parsePolicyLogsQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<PolicyChangeLogRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftScope, setDraftScope] = useState(listQ.scope);
  const [draftSummary, setDraftSummary] = useState(listQ.summary);
  const [draftSource, setDraftSource] = useState(listQ.source);
  const [draftActorId, setDraftActorId] = useState(listQ.actorId);

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftScope(listQ.scope);
    setDraftSummary(listQ.summary);
    setDraftSource(listQ.source);
    setDraftActorId(listQ.actorId);
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-policy-logs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<PolicyChangeLogsRes>(
      "AdminCommunityPolicyChangeLogsPage",
      apiUrl(
        routes.admin.communityPolicyChangeLogs({
          limit: listQ.limit,
          ...(listQ.scope ? { scope: listQ.scope } : {}),
          ...(listQ.summary ? { summary: listQ.summary } : {}),
          ...(listQ.source ? { source: listQ.source } : {}),
          ...(listQ.actorId ? { actor_id: listQ.actorId } : {}),
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
        logAdminFetch("AdminCommunityPolicyChangeLogsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const aTrim = draftActorId.trim();
    const nextActor = isUuidString(aTrim) ? aTrim : "";
    router.push(
      buildPolicyLogsPath({
        limit: nextLimit,
        scope: draftScope.trim().slice(0, SCOPE_MAX),
        summary: draftSummary.trim().slice(0, SUMMARY_MAX),
        source: draftSource.trim().slice(0, SOURCE_MAX),
        actorId: nextActor,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : listQ.limit;
    router.push(
      buildPolicyLogsPath({
        limit: nextLimit,
        scope: "",
        summary: "",
        source: "",
        actorId: "",
      }),
    );
  };

  const hasTextFilters =
    Boolean(listQ.scope) || Boolean(listQ.summary) || Boolean(listQ.source) || Boolean(listQ.actorId);

  return {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftScope,
    setDraftScope,
    draftSummary,
    setDraftSummary,
    draftSource,
    setDraftSource,
    draftActorId,
    setDraftActorId,
    apply,
    clearNonLimitFilters,
    hasTextFilters,
  };
}
