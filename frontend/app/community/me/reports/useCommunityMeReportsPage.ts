"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import type { LocaleTranslateFn } from "@/lib/i18n";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { deriveListDataState, type DataState } from "@/lib/dataState";
import {
  useCommunityMeReportsListQuery,
  type CommunityMeReportListItem,
} from "@/lib/useCommunityMeReportsListQuery";

export type { CommunityMeReportListItem };

export type CommunityMeReportsPageViewModel = {
  t: LocaleTranslateFn;
  isLoggedIn: boolean;
  authPending: boolean;
  loginReturnPath: string;
  loading: boolean;
  items: CommunityMeReportListItem[];
  loadError: string | null;
  reportsListState: DataState<readonly CommunityMeReportListItem[]>;
  reportsListTruncated: boolean;
  reportsHasMore: boolean;
  reportsLoadMoreBusy: boolean;
  loadMoreReports: () => void;
  reload: () => void;
};

/** 160：举报人工单列表 VM（`GET …/community/me/reports`） */
export function useCommunityMeReportsPage(): CommunityMeReportsPageViewModel {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "posts"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [retryKey, setRetryKey] = useState(0);

  const {
    items,
    loading,
    loadError,
    reportsListTruncated,
    reportsHasMore,
    reportsLoadMoreBusy,
    loadMoreReports,
  } = useCommunityMeReportsListQuery({
    retryKey,
    t,
    isLoggedIn,
    authPending,
  });

  const reload = () => {
    setRetryKey((k) => k + 1);
  };

  const reportsListState = useMemo(
    () => deriveListDataState({ loading, error: loadError, items }),
    [loading, loadError, items],
  );

  return {
    t,
    isLoggedIn,
    authPending,
    loginReturnPath,
    loading,
    items,
    loadError,
    reportsListState,
    reportsListTruncated,
    reportsHasMore,
    reportsLoadMoreBusy,
    loadMoreReports,
    reload,
  };
}
