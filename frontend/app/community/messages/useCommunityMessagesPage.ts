// search-params gate: parent route provides Suspense boundary.
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { getConversations, getMeLikesReceived } from "@/lib/apiClient/community";
import {
  communityMeLikesReceivedQueryKey,
  parseCommunityMeLikesReceivedResponse,
} from "@/lib/communityMeLikesReceivedContract";
import { getMe } from "@/lib/apiClient/me";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import {
  isCommunityMeLikesReceivedFetchEnabled,
  isCommunityMeLikesReceivedMetricUserHiddenOnDevice,
} from "@/lib/communityMeLikesMetricPrivacy";
import { useCommunityMeLikesReceivedCachePurgeOnHide } from "@/lib/useCommunityMeLikesReceivedCachePurgeOnHide";
import { useCommunityMeHideLikesReceivedMetric } from "@/lib/useCommunityMeHideLikesReceivedMetric";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
} from "@/lib/communityConversationsQuery";
import {
  extractCommunityMessagesMeId,
  mapConversationsToApiItems,
  toDisplayConversations,
} from "./communityMessagesPageMap";
import type { CommunityMessagesApiConversationItem } from "./communityMessagesPageTypes";

export function useCommunityMessagesPage() {
  const { t, locale } = useTranslation();
  const dash = t("ui_em_dash");
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") ?? null;
  const sharePostId = searchParams?.get("sharePostId")?.trim() ?? null;
  const messagesTab = searchParams?.get("tab")?.toLowerCase() === "activity" ? "activity" : "dm";
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const likesListEnabled = isCommunityMeLikesListEnabled();
  const [hideLikesReceivedMetric] = useCommunityMeHideLikesReceivedMetric();
  useCommunityMeLikesReceivedCachePurgeOnHide();
  const fetchLikesMetric =
    isCommunityMeLikesReceivedFetchEnabled(likesListEnabled, hideLikesReceivedMetric) &&
    messagesTab === "activity";

  const likesQ = useQuery({
    queryKey: communityMeLikesReceivedQueryKey,
    queryFn: getMeLikesReceived,
    enabled: isLoggedIn && !authPending && fetchLikesMetric,
    staleTime: 60_000,
  });
  const likesParse =
    fetchLikesMetric && likesQ.isSuccess && likesQ.data != null
      ? parseCommunityMeLikesReceivedResponse(likesQ.data)
      : null;
  const likesReceived = fetchLikesMetric && likesParse?.kind === "ok" ? likesParse.n : 0;
  const likesContractInvalid =
    fetchLikesMetric && likesQ.isSuccess && likesQ.data != null && likesParse?.kind === "invalid";
  const likesErrorMessage = likesContractInvalid
    ? t("community_me_social_stats_contract_invalid")
    : likesQ.isError && likesQ.error != null
      ? mapApiReadError(likesQ.error, t, "community_activity_likes_load_failed")
      : null;

  const setMessagesTab = useCallback(
    (next: "dm" | "activity") => {
      if (typeof window === "undefined") return;
      const u = new URL(window.location.href);
      if (next === "activity") u.searchParams.set("tab", "activity");
      else u.searchParams.delete("tab");
      const qs = u.searchParams.toString();
      router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (!sharePostId && !orderId) return;
    if (searchParams?.get("tab")?.toLowerCase() !== "activity") return;
    const u = new URL(window.location.href);
    u.searchParams.delete("tab");
    const qs = u.searchParams.toString();
    router.replace(`${u.pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [sharePostId, orderId, searchParams, router]);

  const dmEnabled = isLoggedIn && !authPending && messagesTab === "dm";

  const convQ = useQuery({
    queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
    queryFn: getConversations,
    enabled: dmEnabled,
    staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
  });

  const meQ = useQuery({
    queryKey: ["community", "messages", "me"],
    queryFn: getMe,
    enabled: dmEnabled,
    staleTime: 60_000,
  });

  const listLoadError = useMemo(() => {
    if (!dmEnabled) return null;
    if (convQ.isError && convQ.error != null) {
      return mapApiReadError(convQ.error, t, "community_messages_listLoadFailed");
    }
    if (meQ.isError && meQ.error != null) {
      return mapApiReadError(meQ.error, t, "community_messages_listLoadFailed");
    }
    return null;
  }, [dmEnabled, convQ.isError, convQ.error, meQ.isError, meQ.error, t]);

  const apiList = useMemo((): CommunityMessagesApiConversationItem[] | null => {
    if (!dmEnabled || listLoadError != null || convQ.data == null) return null;
    const meId = meQ.data ? extractCommunityMessagesMeId(meQ.data) : undefined;
    return mapConversationsToApiItems(convQ.data.conversations ?? [], meId, dash);
  }, [dmEnabled, listLoadError, convQ.data, meQ.data, dash]);

  const loading = dmEnabled && (convQ.isLoading || meQ.isLoading);

  const [pullY, setPullY] = useState(0);
  const pullStartYRef = useRef<number | null>(null);
  const pullYRef = useRef(0);
  pullYRef.current = pullY;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const retryList = useCallback(() => {
    void convQ.refetch();
    void meQ.refetch();
  }, [convQ, meQ]);
  const retryListRef = useRef(retryList);
  retryListRef.current = retryList;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const PULL_THRESHOLD = 50;
    const RESISTANCE = 0.5;
    const handleStart = (e: TouchEvent) => {
      if (window.scrollY <= 0 && e.touches[0]) pullStartYRef.current = e.touches[0].clientY;
    };
    const handleMove = (e: TouchEvent) => {
      if (pullStartYRef.current === null || !e.touches[0]) return;
      if (window.scrollY > 0) {
        pullStartYRef.current = null;
        setPullY(0);
        return;
      }
      const dy = (e.touches[0].clientY - pullStartYRef.current) * RESISTANCE;
      if (dy > 0) setPullY(Math.min(dy, 80));
    };
    const handleEnd = () => {
      if (pullYRef.current >= PULL_THRESHOLD && !loadingRef.current) retryListRef.current();
      setPullY(0);
      pullStartYRef.current = null;
    };
    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  const displayList = useMemo(
    () => toDisplayConversations(apiList, listLoadError),
    [apiList, listLoadError],
  );
  const isEmpty = !loading && listLoadError == null && displayList.length === 0;

  return {
    t,
    locale,
    dash,
    router,
    orderId,
    sharePostId,
    messagesTab,
    isLoggedIn,
    authPending,
    likesListEnabled,
    hideLikesReceivedMetric,
    fetchLikesMetric,
    likesQ,
    likesReceived,
    likesContractInvalid,
    likesErrorMessage,
    setMessagesTab,
    loading,
    listLoadError,
    pullY,
    retryList,
    displayList,
    isEmpty,
  };
}

export type CommunityMessagesPageViewModel = ReturnType<typeof useCommunityMessagesPage>;
