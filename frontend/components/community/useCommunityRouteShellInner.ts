import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { getConversations } from "@/lib/apiClient/community";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
  scheduleCommunityIdleWork,
  shouldEagerFetchCommunityConversations,
} from "@/lib/communityConversationsQuery";
import { COMMUNITY_ROUTE_SHELL_TAB_NAV_BAR_MS } from "./communityRouteShellConstants";

/** 壳层内逻辑：须在 CommunityAuthProvider 内以按登录态拉取会话未读（避免匿名用户反复请求会话 API）。 */
export function useCommunityRouteShellInner() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineRecovery, setShowOnlineRecovery] = useState(false);
  const [showTabProgress, setShowTabProgress] = useState(false);
  const tabProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deferConversationsFetch, setDeferConversationsFetch] = useState(() =>
    shouldEagerFetchCommunityConversations(pathname),
  );

  useEffect(() => {
    if (shouldEagerFetchCommunityConversations(pathname)) {
      setDeferConversationsFetch(true);
      return;
    }
    return scheduleCommunityIdleWork(() => setDeferConversationsFetch(true));
  }, [pathname]);

  const { data: convData, isError: layoutUnreadError, error: layoutUnreadQueryError } = useQuery({
    queryKey: COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
    queryFn: getConversations,
    enabled: isLoggedIn && !authPending && deferConversationsFetch,
    staleTime: COMMUNITY_CONVERSATIONS_STALE_MS,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (layoutUnreadError && layoutUnreadQueryError) {
      console.error("CommunityLayout layoutUnread query failed:", layoutUnreadQueryError);
    }
  }, [layoutUnreadError, layoutUnreadQueryError]);

  const totalUnread = useMemo(() => {
    if (!isLoggedIn) return 0;
    const list = convData?.conversations ?? [];
    return list.reduce((s, c) => s + (typeof c.unread_count === "number" && c.unread_count > 0 ? c.unread_count : 0), 0);
  }, [convData, isLoggedIn]);

  const onTabNavStart = useCallback(() => {
    setShowTabProgress(true);
    if (tabProgressTimerRef.current) clearTimeout(tabProgressTimerRef.current);
    tabProgressTimerRef.current = setTimeout(() => {
      tabProgressTimerRef.current = null;
      setShowTabProgress(false);
    }, COMMUNITY_ROUTE_SHELL_TAB_NAV_BAR_MS);
  }, []);

  useEffect(() => {
    setShowTabProgress(true);
    if (tabProgressTimerRef.current) clearTimeout(tabProgressTimerRef.current);
    tabProgressTimerRef.current = setTimeout(() => {
      tabProgressTimerRef.current = null;
      setShowTabProgress(false);
    }, COMMUNITY_ROUTE_SHELL_TAB_NAV_BAR_MS);
  }, [pathname]);

  useEffect(
    () => () => {
      if (tabProgressTimerRef.current) clearTimeout(tabProgressTimerRef.current);
    },
    []
  );

  // 切换 Tab 时恢复滚动并滚到顶部；在下一帧恢复 body 滚动，避免被弹窗 cleanup 再次锁住
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      requestAnimationFrame(() => {
        document.body.style.overflow = "";
      });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      setShowOnlineRecovery(true);
      if (onlineRecoveryTimerRef.current) clearTimeout(onlineRecoveryTimerRef.current);
      onlineRecoveryTimerRef.current = setTimeout(() => {
        onlineRecoveryTimerRef.current = null;
        setShowOnlineRecovery(false);
      }, 2800);
    };
    const onOffline = () => setIsOnline(false);
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (onlineRecoveryTimerRef.current) clearTimeout(onlineRecoveryTimerRef.current);
    };
  }, []);

  return {
    pathname,
    t,
    isOnline,
    showOnlineRecovery,
    showTabProgress,
    totalUnread,
    onTabNavStart,
  };
}
