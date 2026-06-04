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

import {
  type AdminReviewRow,
  type AdminReviewsRes,
  buildReviewsListPath,
  parseDraftReviewsLimit,
  parseDraftReviewsScore,
  parseReviewsListQuery,
} from "./adminReviewsPageModel";

export function useAdminReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listQ = useMemo(
    () => parseReviewsListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [itemsNotArrayError, setItemsNotArrayError] = useState(false);
  const [items, setItems] = useState<AdminReviewRow[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(listQ.limit));
  const [draftMax, setDraftMax] = useState(
    listQ.maxScore != null ? String(listQ.maxScore) : "",
  );
  const [draftMin, setDraftMin] = useState(
    listQ.minScore != null ? String(listQ.minScore) : "",
  );

  useEffect(() => {
    setDraftLimit(String(listQ.limit));
    setDraftMax(listQ.maxScore != null ? String(listQ.maxScore) : "");
    setDraftMin(listQ.minScore != null ? String(listQ.minScore) : "");
  }, [listQ]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setItemsNotArrayError(false);
    setMeta(null);

    const path = routes.admin.reviews({
      limit: listQ.limit,
      ...(listQ.minScore != null ? { min_score: listQ.minScore } : {}),
      ...(listQ.maxScore != null ? { max_score: listQ.maxScore } : {}),
    });

    const headers: Record<string, string> = { "x-request-id": `admin-reviews-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // allow 401/403
    }

    adminFetchJson<AdminReviewsRes>("AdminReviewsPage", apiUrl(path), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        const rawItems = body.items;
        if (rawItems == null) {
          setItems([]);
          setItemsNotArrayError(false);
        } else if (!Array.isArray(rawItems)) {
          if (typeof window !== "undefined") {
            console.error("AdminReviewsPage: items is not an array", rawItems);
          }
          setItems([]);
          setItemsNotArrayError(true);
        } else {
          setItems(rawItems);
          setItemsNotArrayError(false);
        }
        setAppliedFilters(body.applied_filters ?? null);
        setMeta(isAdminMetaRecord(body.meta) ? body.meta : null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminReviewsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [listQ]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const limit = parseDraftReviewsLimit(draftLimit);
    const minScore = parseDraftReviewsScore(draftMin);
    const maxScore = parseDraftReviewsScore(draftMax);
    router.push(
      buildReviewsListPath({
        limit,
        ...(minScore != null ? { minScore } : {}),
        ...(maxScore != null ? { maxScore } : {}),
      }),
    );
  };

  const presetLow = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(buildReviewsListPath({ limit: 100, maxScore: 2 }));
  };

  const clearScores = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(buildReviewsListPath({ limit: parseDraftReviewsLimit(draftLimit) }));
  };

  return {
    loading,
    error,
    itemsNotArrayError,
    items,
    appliedFilters,
    meta,
    draftLimit,
    setDraftLimit,
    draftMax,
    setDraftMax,
    draftMin,
    setDraftMin,
    apply,
    presetLow,
    clearScores,
  };
}

export type AdminReviewsPageViewModel = ReturnType<typeof useAdminReviewsPage>;
