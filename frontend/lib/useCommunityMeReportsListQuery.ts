"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMyCommunityReports } from "@/lib/apiClient/community";
import { COMMUNITY_ME_REPORTS_LIST_API_MAX } from "@/lib/apiClient/community/constants";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { interpretCommunityWriteError } from "@/lib/formatCommunityApiMessage";
import { COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE } from "@/lib/communityMeListPageSize";

export type CommunityMeReportListItem = {
  id: string;
  target_type: string;
  target_id: string;
  reason_code: string;
  status: string;
  created_at: string;
};

export function useCommunityMeReportsListQuery(args: {
  retryKey: number;
  t: (k: string) => string;
  isLoggedIn: boolean;
  authPending: boolean;
}): {
  items: CommunityMeReportListItem[];
  loading: boolean;
  loadError: string | null;
  reportsListTruncated: boolean;
  reportsHasMore: boolean;
  reportsLoadMoreBusy: boolean;
  loadMoreReports: () => void;
} {
  const { retryKey, t, isLoggedIn, authPending } = args;
  const [items, setItems] = useState<CommunityMeReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fetchLimit, setFetchLimit] = useState(COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE);
  const [reportsListTruncated, setReportsListTruncated] = useState(false);
  const [reportsLoadMoreBusy, setReportsLoadMoreBusy] = useState(false);
  const loadMoreInFlightRef = useRef(false);

  const applyReportsResponse = useCallback((rows: CommunityMeReportListItem[], requestedLimit: number) => {
    setItems(rows);
    setFetchLimit(requestedLimit);
    const fullPage = rows.length === requestedLimit;
    const atApiMax = requestedLimit >= COMMUNITY_ME_REPORTS_LIST_API_MAX;
    setReportsListTruncated(atApiMax && fullPage);
  }, []);

  const fetchReports = useCallback(
    async (limit: number) => {
      const data = await getMyCommunityReports({ limit });
      if (data?.status === "ok" && Array.isArray(data.items)) {
        applyReportsResponse(data.items, limit);
        setLoadError(null);
        return;
      }
      const { topMessage } = interpretCommunityWriteError(data, t, "community_report_list_load_failed");
      setItems([]);
      setFetchLimit(COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE);
      setReportsListTruncated(false);
      setLoadError(topMessage ?? t("community_report_list_load_failed"));
    },
    [applyReportsResponse, t],
  );

  useEffect(() => {
    if (authPending) return;
    if (!isLoggedIn) {
      setLoading(false);
      setItems([]);
      setLoadError(null);
      setFetchLimit(COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE);
      setReportsListTruncated(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setFetchLimit(COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE);
    setReportsListTruncated(false);

    void fetchReports(COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE)
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setLoadError(mapApiReadError(err, t, "community_report_list_load_failed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authPending, isLoggedIn, retryKey, t, fetchReports]);

  const reportsHasMore =
    items.length > 0 &&
    items.length === fetchLimit &&
    fetchLimit < COMMUNITY_ME_REPORTS_LIST_API_MAX &&
    !loadError;

  const loadMoreReports = useCallback(() => {
    if (!reportsHasMore || loadMoreInFlightRef.current || !isLoggedIn) return;
    const nextLimit = Math.min(
      fetchLimit + COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE,
      COMMUNITY_ME_REPORTS_LIST_API_MAX,
    );
    if (nextLimit <= fetchLimit) return;
    loadMoreInFlightRef.current = true;
    setReportsLoadMoreBusy(true);
    void fetchReports(nextLimit)
      .catch((err) => {
        setLoadError(mapApiReadError(err, t, "community_report_list_load_failed"));
      })
      .finally(() => {
        loadMoreInFlightRef.current = false;
        setReportsLoadMoreBusy(false);
      });
  }, [fetchLimit, fetchReports, isLoggedIn, reportsHasMore, t]);

  return {
    items,
    loading,
    loadError,
    reportsListTruncated,
    reportsHasMore,
    reportsLoadMoreBusy,
    loadMoreReports,
  };
}
