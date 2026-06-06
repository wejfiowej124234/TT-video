// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { isUuidString } from "@/lib/isUuidString";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  SOURCE_MAX,
  SCOPE_MAX,
  SUMMARY_MAX,
  type PolicyChangeLogRow,
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

  const listUrl = useMemo(
    () =>
      routes.admin.communityPolicyChangeLogs({
        limit: listQ.limit,
        ...(listQ.scope ? { scope: listQ.scope } : {}),
        ...(listQ.summary ? { summary: listQ.summary } : {}),
        ...(listQ.source ? { source: listQ.source } : {}),
        ...(listQ.actorId ? { actor_id: listQ.actorId } : {}),
      }),
    [listQ],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<PolicyChangeLogRow>({
      scope: "community-policy-change-logs",
      context: "AdminCommunityPolicyChangeLogsPage",
      listUrl,
    });

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
    refreshing,
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
