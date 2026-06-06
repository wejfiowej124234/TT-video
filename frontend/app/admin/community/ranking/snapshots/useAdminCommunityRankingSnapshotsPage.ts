// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { routes } from "@/lib/api";
import { useAdminStandardListFetch } from "@/lib/admin/useAdminStandardListFetch";

import {
  type RankSnapshotRow,
  RANK_SNAPSHOTS_FEED_MODE_MAX,
  buildRankSnapshotsPath,
  parseRankSnapshotsQuery,
} from "./adminCommunityRankingSnapshotsPageModel";

export function useAdminCommunityRankingSnapshotsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { limit, feedMode } = useMemo(
    () => parseRankSnapshotsQuery(new URLSearchParams(searchParams?.toString() ?? "")),
    [searchParams],
  );

  const listUrl = useMemo(
    () =>
      routes.admin.communityRankingSnapshots({
        limit,
        ...(feedMode ? { feed_mode: feedMode } : {}),
      }),
    [limit, feedMode],
  );

  const { items, meta, appliedFilters, loading, refreshing, error } =
    useAdminStandardListFetch<RankSnapshotRow>({
      scope: "community-ranking-snapshots",
      context: "AdminCommunityRankingSnapshotsPage",
      listUrl,
    });

  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftFeedMode, setDraftFeedMode] = useState(feedMode);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftFeedMode(feedMode);
  }, [limit, feedMode]);

  const apply = (e?: FormEvent) => {
    e?.preventDefault();
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : 50;
    router.push(
      buildRankSnapshotsPath({
        limit: nextLimit,
        feedMode: draftFeedMode.trim().slice(0, RANK_SNAPSHOTS_FEED_MODE_MAX),
      }),
    );
  };

  const resetFilters = () => {
    const n = Number.parseInt(draftLimit.trim(), 10);
    const nextLimit = Number.isFinite(n) ? Math.min(200, Math.max(1, n)) : limit;
    router.push(buildRankSnapshotsPath({ limit: nextLimit, feedMode: "" }));
  };

  const hasActiveFilters = Boolean(feedMode);

  return {
    limit,
    feedMode,
    loading,
    refreshing,
    error,
    items,
    meta,
    appliedFilters,
    draftLimit,
    setDraftLimit,
    draftFeedMode,
    setDraftFeedMode,
    apply,
    resetFilters,
    hasActiveFilters,
  };
}
