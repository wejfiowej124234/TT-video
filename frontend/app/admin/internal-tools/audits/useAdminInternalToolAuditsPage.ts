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
  TOOL_AUDITS_ACTION_MAX,
  TOOL_AUDITS_ACTOR_MAX,
  TOOL_AUDITS_TOOL_ID_MAX,
  type InternalToolAuditRow,
  type InternalToolAuditsListRes,
  buildToolAuditsListPath,
  parseToolAuditsListQuery,
} from "./adminInternalToolAuditsPageModel";

export function useAdminInternalToolAuditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, toolId, actionCode, actorId, approvalRequestId } = useMemo(
    () => parseToolAuditsListQuery(new URLSearchParams(searchParams.toString()), isUuidString),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<InternalToolAuditRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftToolId, setDraftToolId] = useState(toolId);
  const [draftActionCode, setDraftActionCode] = useState(actionCode);
  const [draftActorId, setDraftActorId] = useState(actorId);
  const [draftApproval, setDraftApproval] = useState(approvalRequestId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftToolId(toolId);
    setDraftActionCode(actionCode);
    setDraftActorId(actorId);
    setDraftApproval(approvalRequestId);
  }, [limit, toolId, actionCode, actorId, approvalRequestId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-tool-audits-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<InternalToolAuditsListRes>(
      "AdminInternalToolAuditsPage",
      apiUrl(
        routes.admin.internalToolAudits({
          limit: effLimit,
          ...(toolId ? { tool_id: toolId } : {}),
          ...(actionCode ? { action_code: actionCode } : {}),
          ...(actorId ? { actor_id: actorId } : {}),
          ...(approvalRequestId ? { approval_request_id: approvalRequestId } : {}),
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
        logAdminFetch("AdminInternalToolAuditsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, toolId, actionCode, actorId, approvalRequestId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const apTrim = draftApproval.trim();
    const ap = isUuidString(apTrim) ? apTrim : "";
    router.push(
      buildToolAuditsListPath(
        {
          limit: nextLimit,
          toolId: draftToolId.trim().slice(0, TOOL_AUDITS_TOOL_ID_MAX),
          actionCode: draftActionCode.trim().slice(0, TOOL_AUDITS_ACTION_MAX),
          actorId: draftActorId.trim().slice(0, TOOL_AUDITS_ACTOR_MAX),
          approvalRequestId: ap,
        },
        isUuidString,
      ),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildToolAuditsListPath(
        {
          limit: nextLimit,
          toolId: "",
          actionCode: "",
          actorId: "",
          approvalRequestId: "",
        },
        isUuidString,
      ),
    );
  };

  const hasActiveFilters =
    Boolean(toolId) || Boolean(actionCode) || Boolean(actorId) || Boolean(approvalRequestId);

  return {
    loading,
    error,
    items,
    meta,
    appliedFilters,
    toolId,
    actionCode,
    actorId,
    approvalRequestId,
    draftLimit,
    setDraftLimit,
    draftToolId,
    setDraftToolId,
    draftActionCode,
    setDraftActionCode,
    draftActorId,
    setDraftActorId,
    draftApproval,
    setDraftApproval,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}
