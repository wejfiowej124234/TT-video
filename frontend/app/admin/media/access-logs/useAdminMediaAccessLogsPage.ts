// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/api";
import { isUuidString } from "@/lib/isUuidString";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  MEDIA_ACCESS_LOGS_ACTION_MAX,
  MEDIA_ACCESS_LOGS_ACTOR_MAX,
  MEDIA_ACCESS_LOGS_OBJECT_MAX,
  type MediaAccessLogRow,
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

  const listUrl = useMemo(() => {
    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    return routes.admin.mediaAccessLogs({
      limit: effLimit,
      ...(action ? { action } : {}),
      ...(objectId ? { object_id: objectId } : {}),
      ...(actorOrIp ? { actor_or_ip: actorOrIp } : {}),
      ...(tokenId ? { token_id: tokenId } : {}),
    });
  }, [limit, action, objectId, actorOrIp, tokenId]);

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<MediaAccessLogRow>({
      scope: "media-access-logs",
      context: "AdminMediaAccessLogsPage",
      listUrl,
    });

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
    refreshing,
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
