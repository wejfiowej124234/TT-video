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
  MEDIA_ACCESS_LOGS_ACTION_MAX,
  MEDIA_ACCESS_LOGS_ACTOR_MAX,
  MEDIA_ACCESS_LOGS_OBJECT_MAX,
  type MediaAccessLogRow,
  type MediaAccessLogsRes,
  buildMediaAccessLogsListPath,
  isValidMediaActionSegment,
  parseMediaAccessLogsQuery,
} from "./adminMediaAccessLogsPageModel";

export function useAdminMediaAccessLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, action, objectId, actorOrIp, tokenId } = useMemo(
    () => parseMediaAccessLogsQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<MediaAccessLogRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftAction, setDraftAction] = useState(action);
  const [draftObjectId, setDraftObjectId] = useState(objectId);
  const [draftActor, setDraftActor] = useState(actorOrIp);
  const [draftToken, setDraftToken] = useState(tokenId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftAction(action);
    setDraftObjectId(objectId);
    setDraftActor(actorOrIp);
    setDraftToken(tokenId);
  }, [limit, action, objectId, actorOrIp, tokenId]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-media-logs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<MediaAccessLogsRes>(
      "AdminMediaAccessLogsPage",
      apiUrl(
        routes.admin.mediaAccessLogs({
          limit: effLimit,
          ...(action ? { action } : {}),
          ...(objectId ? { object_id: objectId } : {}),
          ...(actorOrIp ? { actor_or_ip: actorOrIp } : {}),
          ...(tokenId ? { token_id: tokenId } : {}),
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
        logAdminFetch("AdminMediaAccessLogsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, action, objectId, actorOrIp, tokenId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const ac = draftAction.trim().slice(0, MEDIA_ACCESS_LOGS_ACTION_MAX);
    const nextAction = isValidMediaActionSegment(ac) ? ac : "";
    const tokTrim = draftToken.trim();
    const nextTok = isUuidString(tokTrim) ? tokTrim : "";
    router.push(
      buildMediaAccessLogsListPath({
        limit: nextLimit,
        action: nextAction,
        objectId: draftObjectId.trim().slice(0, MEDIA_ACCESS_LOGS_OBJECT_MAX),
        actorOrIp: draftActor.trim().slice(0, MEDIA_ACCESS_LOGS_ACTOR_MAX),
        tokenId: nextTok,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildMediaAccessLogsListPath({
        limit: nextLimit,
        action: "",
        objectId: "",
        actorOrIp: "",
        tokenId: "",
      }),
    );
  };

  const hasActiveFilters =
    Boolean(action) || Boolean(objectId) || Boolean(actorOrIp) || Boolean(tokenId);

  return {
    limit,
    action,
    objectId,
    actorOrIp,
    tokenId,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftAction,
    setDraftAction,
    draftObjectId,
    setDraftObjectId,
    draftActor,
    setDraftActor,
    draftToken,
    setDraftToken,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}

export type AdminMediaAccessLogsPageViewModel = ReturnType<typeof useAdminMediaAccessLogsPage>;
