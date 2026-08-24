"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { CommunityAuthProvider, useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { CommunityPublishProvider } from "@/components/community/CommunityPublishContext";
import { CommunitySupportMenu } from "@/components/community/CommunitySupportMenu";
import { getConversations } from "@/lib/apiClient/community";
import {
  COMMUNITY_CONVERSATIONS_LAYOUT_QUERY_KEY,
  COMMUNITY_CONVERSATIONS_STALE_MS,
  scheduleCommunityIdleWork,
  shouldEagerFetchCommunityConversations,
} from "@/lib/communityConversationsQuery";
import {
  communityHeaderInlineFocus,
} from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import CommunityAmbientBackdrop from "@/components/community/CommunityAmbientBackdrop";
import { warmCommunityPublishDrawer, warmCommunityTabRoute } from "@/lib/communityDrawerPrefetch";
import { CommunityRouteShellTabLinks } from "@/components/community/CommunityRouteShellTabLinks";
import { CommunityRouteShellMobileBottomNav } from "@/components/community/CommunityRouteShellMobileBottomNav";
import { darkRoutePageShellClass, resolveCommunityBackdropSurface } from "@/lib/marketingDarkPremiumBg";
import {
  TT_COMMUNITY_SHELL_L5,
  TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_HEADER_SUPPORT_RAIL_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_MOBILE_HEADER_COMMUNITY_PREMIUM,
  TT_MARKETING_COMMUNITY_L1_STICKY_BAND_CLASS,
} from "@/lib/marketingUi";
import { COMMUNITY_ROUTE_SHELL_TAB_NAV_BAR_MS } from "./communityRouteShellConstants";

/** 壳层内容：须在 CommunityAuthProvider 内以按登录态拉取会话未读（避免匿名用户反复请求会话 API）。 */
function CommunityLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  useEffect(() => () => {
    if (tabProgressTimerRef.current) clearTimeout(tabProgressTimerRef.current);
  }, []);

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

  const communitySurface = resolveCommunityBackdropSurface();

  return (
    <div
      className={`${darkRoutePageShellClass(communitySurface)} overflow-x-clip max-w-[100vw]`}
      data-tt-community-dark-surface={communitySurface}
      data-tt-community-phase1-frozen="1"
    >
      <CommunityAmbientBackdrop />
      {!isOnline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 border-b border-warning/50 bg-warning/20 px-3 py-2 text-center text-meta text-warning/95 safe-area-inset-t"
          role="alert"
          aria-live="polite"
        >
          {t("community_offline_hint")}
        </div>
      )}
      {isOnline && showOnlineRecovery && (
        <div
          className="fixed top-0 left-0 right-0 z-50 border-b border-success/45 bg-success/15 px-3 py-2 text-center text-meta text-success safe-area-inset-t"
          role="status"
          aria-live="polite"
        >
          {t("community_online_hint")}
        </div>
      )}
      {/* 移动：L1 标题+发现+返回；L2 平台与支持（与主 Tab 底栏分层）。z-[110] 同下 */}
      <header className={TT_MARKETING_DARK_ROUTE_MOBILE_HEADER_COMMUNITY_PREMIUM}>
        <div className="px-3 py-2 flex items-center justify-between gap-2 min-h-[44px]">
          <Link
            href="/community"
            className={`${touchTargetLink44Classes} shrink-0 ${TT_COMMUNITY_SHELL_L5.titleLinkClass} ${communityHeaderInlineFocus}`}
          >
            {t("community_title")}
          </Link>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              href="/community/explore"
              prefetch={true}
              onPointerEnter={() => warmCommunityTabRoute(router, "/community/explore", queryClient)}
              className={`${touchTargetLink44Classes} ${TT_COMMUNITY_SHELL_L5.metaLinkClass} ${communityHeaderInlineFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <Link
              href="/"
              className={`${touchTargetLink44Classes} ${TT_COMMUNITY_SHELL_L5.metaLinkClass} ${communityHeaderInlineFocus}`}
            >
              {t("community_back")}
            </Link>
          </div>
        </div>
        <div className={TT_MARKETING_DARK_ROUTE_HEADER_SUPPORT_RAIL_COMMUNITY_PREMIUM}>
          <nav aria-label={t("community_nav_support_aria")} className="flex flex-wrap items-center justify-end">
            <CommunitySupportMenu size="sm" />
          </nav>
        </div>
      </header>

      {/* 桌面：L1 全宽主 Tab；L2 分隔线下的平台与支持（非与 Tab 并排同级视觉） */}
      <header className={TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM}>
        {showTabProgress && (
          <div className={TT_COMMUNITY_SHELL_L5.tabProgressClass} role="progressbar" aria-valuenow={undefined} aria-label={t("common_loading") || "Loading"} />
        )}
        <div className={`max-w-6xl mx-auto px-3 py-2.5 sm:px-4 ${TT_MARKETING_COMMUNITY_L1_STICKY_BAND_CLASS}`}>
          <nav aria-label={t("community_nav_tabs_aria")} className="overflow-visible">
            <CommunityRouteShellTabLinks
              pathname={pathname}
              t={t}
              totalUnread={totalUnread}
              onNavStart={onTabNavStart}
              className="w-full"
            />
          </nav>
        </div>
      </header>

      <div
        className={`relative z-0 pb-20 md:pb-0 md:pt-3 lg:pt-4 min-w-0 w-full overflow-x-clip ${!isOnline || showOnlineRecovery ? "pt-10" : ""}`}
      >
        {children}
      </div>

      {/* 移动端：底部 Tab 导航（动态/消息/发布/好友/我），z-[110] 确保在发布弹窗遮罩留白区内可点击；pointerdown 即显示顶栏进度条，满足 200ms 内可感知反馈 */}
      <nav
        className={TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV_COMMUNITY_PREMIUM}
        aria-label={t("community_nav_tabs_aria")}
      >
        {showTabProgress && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-ref-sun/80" role="progressbar" aria-valuenow={undefined} aria-label={t("common_loading") || "Loading"} />
        )}
        <div className="max-w-4xl mx-auto px-2 py-2 relative">
          <CommunityRouteShellMobileBottomNav
            pathname={pathname}
            t={t}
            totalUnread={totalUnread}
            onNavStart={onTabNavStart}
          />
        </div>
      </nav>
    </div>
  );
}

/** 31 §5.1：L1 主 Tab + 同条「帮助与支持」下拉（桌面）；移动顶栏 L2 仍为帮助入口。52 §7.5 / 13 宪法：Tab 切换可感知反馈。 */
export default function CommunityRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <CommunityPublishProvider>
      <CommunityAuthProvider>
        <CommunityLayoutInner>{children}</CommunityLayoutInner>
      </CommunityAuthProvider>
    </CommunityPublishProvider>
  );
}
