// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";
import { routes } from "@/lib/api";

import {
  type AdminReviewRow,
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

  const listUrl = useMemo(
    () =>
      routes.admin.reviews({
        limit: listQ.limit,
        ...(listQ.minScore != null ? { min_score: listQ.minScore } : {}),
        ...(listQ.maxScore != null ? { max_score: listQ.maxScore } : {}),
      }),
    [listQ],
  );

  const { items, appliedFilters, meta, loading, refreshing, error, itemsMalformed } =
    useAdminStandardListFetch<AdminReviewRow>({
      scope: "reviews",
      context: "AdminReviewsPage",
      listUrl,
    });

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
    refreshing,
    error,
    itemsNotArrayError: itemsMalformed,
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
