// search-params gate: parent route provides Suspense boundary.
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  type RankSnapshotRow,
  type RankSnapshotsListRes,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [items, setItems] = useState<RankSnapshotRow[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown> | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);
  const [draftLimit, setDraftLimit] = useState(String(limit));
  const [draftFeedMode, setDraftFeedMode] = useState(feedMode);

  useEffect(() => {
    setDraftLimit(String(limit));
    setDraftFeedMode(feedMode);
  }, [limit, feedMode]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setMeta(null);
    setAppliedFilters(null);

    const headers: Record<string, string> = { "x-request-id": `admin-rank-snap-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403
    }

    adminFetchJson<RankSnapshotsListRes>(
      "AdminCommunityRankingSnapshotsPage",
      apiUrl(
        routes.admin.communityRankingSnapshots({
          limit,
          ...(feedMode ? { feed_mode: feedMode } : {}),
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
        logAdminFetch("AdminCommunityRankingSnapshotsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
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
