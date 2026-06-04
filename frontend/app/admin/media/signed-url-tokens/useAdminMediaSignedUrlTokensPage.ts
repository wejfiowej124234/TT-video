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
  OBJECT_MAX,
  SCOPE_URL,
  type SignedUrlTokenRow,
  type SignedUrlTokensRes,
  buildSignedUrlTokensListPath,
  parseSignedUrlTokensQuery,
} from "./adminMediaSignedUrlTokensPageModel";

export function useAdminMediaSignedUrlTokensPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { limit, objectId, urlScope, issuedTo, tokenId } = useMemo(
    () => parseSignedUrlTokensQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<SignedUrlTokenRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftObjectId, setDraftObjectId] = useState(objectId);
  const [draftUrlScope, setDraftUrlScope] = useState(urlScope);
  const [draftIssuedTo, setDraftIssuedTo] = useState(issuedTo);
  const [draftTokenId, setDraftTokenId] = useState(tokenId);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftObjectId(objectId);
    setDraftUrlScope(urlScope);
    setDraftIssuedTo(issuedTo);
    setDraftTokenId(tokenId);
  }, [limit, objectId, urlScope, issuedTo, tokenId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setAppliedFilters(null);

    const n = Number.parseInt(String(limit), 10);
    const effLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;

    const headers: Record<string, string> = { "x-request-id": `admin-su-tok-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<SignedUrlTokensRes>(
      "AdminMediaSignedUrlTokensPage",
      apiUrl(
        routes.admin.mediaSignedUrlTokens({
          limit: effLimit,
          ...(objectId ? { object_id: objectId } : {}),
          ...(urlScope ? { url_scope: urlScope } : {}),
          ...(issuedTo ? { issued_to: issuedTo } : {}),
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
        logAdminFetch("AdminMediaSignedUrlTokensPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, objectId, urlScope, issuedTo, tokenId]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    const sc = draftUrlScope.trim().toLowerCase();
    const nextScope = SCOPE_URL.has(sc) ? sc : "";
    const issTrim = draftIssuedTo.trim();
    const nextIssued = isUuidString(issTrim) ? issTrim : "";
    const tokTrim = draftTokenId.trim();
    const nextTok = isUuidString(tokTrim) ? tokTrim : "";
    router.push(
      buildSignedUrlTokensListPath({
        limit: nextLimit,
        objectId: draftObjectId.trim().slice(0, OBJECT_MAX),
        urlScope: nextScope,
        issuedTo: nextIssued,
        tokenId: nextTok,
      }),
    );
  };

  const clearNonLimitFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(
      buildSignedUrlTokensListPath({
        limit: nextLimit,
        objectId: "",
        urlScope: "",
        issuedTo: "",
        tokenId: "",
      }),
    );
  };

  const hasActiveFilters = Boolean(objectId) || Boolean(urlScope) || Boolean(issuedTo) || Boolean(tokenId);

  return {
    limit,
    objectId,
    urlScope,
    issuedTo,
    tokenId,
    loading,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftObjectId,
    setDraftObjectId,
    draftUrlScope,
    setDraftUrlScope,
    draftIssuedTo,
    setDraftIssuedTo,
    draftTokenId,
    setDraftTokenId,
    apply,
    clearNonLimitFilters,
    hasActiveFilters,
  };
}

export type AdminMediaSignedUrlTokensPageViewModel = ReturnType<typeof useAdminMediaSignedUrlTokensPage>;
