"use client";

import React, { useEffect, useState, useRef, useCallback, memo, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/components/LocaleProvider";
import { CommunityAuthProvider, useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { CommunityPublishProvider, useCommunityPublish } from "@/components/community/CommunityPublishContext";
import { CommunitySupportMenu } from "@/components/community/CommunitySupportMenu";
import { getConversations } from "@/lib/apiClient/community";
import {
  communityHeaderInlineFocus,
  communityPublishFabFocus,
  communityShellTabFocus,
} from "@/lib/communityA11yFocus";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";

/** L1 主 Tab；建议与反馈已并入 L2「帮助与支持」下拉 */
const TABS = [
  {
    path: "/community",
    pathMatch: (p: string) => p === "/community" || p === "/community/feed" || p.startsWith("/community/topic/"),
    key: "community_tab_feed",
    unread: false,
  },
  {
    path: "/community/explore",
    pathMatch: (p: string) => p.startsWith("/community/explore"),
    key: "community_tab_explore",
    unread: false,
  },
  {
    path: "/community/messages",
    pathMatch: (p: string) => p.startsWith("/community/messages") || p.startsWith("/community/activity"),
    key: "community_tab_messages",
    unread: true,
  },
  { path: "/community/friends", pathMatch: (p: string) => p.startsWith("/community/friends"), key: "community_tab_friends", unread: false },
  { path: "/community/me", pathMatch: (p: string) => p.startsWith("/community/me"), key: "community_tab_me", unread: false },
] as const;

/** L1/底栏激活：青→紫→珊瑚（31 旅行/发现 cyan + 创作者 fuchsia）+ 青/暖双色轻光晕，与暖场底衔接 */
const COMMUNITY_SHELL_TAB_ACTIVE =
  "border border-transparent bg-gradient-to-r from-cyan-600/55 via-fuchsia-600/82 to-ref-coral/75 text-white shadow-[0_0_18px_-5px_rgba(6,182,212,0.32),0_0_20px_-4px_rgba(252,164,124,0.36)]";

/** 52 §7.5 / 13 宪法：Tab 切换 200ms 内可感知反馈，pointerdown 即显示进度条 */
const TAB_NAV_BAR_MS = 400;

const TabLinks = memo(function TabLinks({
  pathname,
  t,
  totalUnread,
  className = "",
  onNavStart,
}: {
  pathname: string | null;
  t: (k: string) => string;
  totalUnread: number;
  className?: string;
  onNavStart?: () => void;
}) {
  return (
    <div className={`flex gap-1 rounded-[var(--radius-md)] p-1 bg-slate-800/60 ring-1 ring-ref-cyan/15 ${className}`}>
      {TABS.map((tab) => {
        const active = tab.pathMatch(pathname ?? "");
        const showBadge = tab.unread && totalUnread > 0;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            prefetch={true}
            onPointerDown={onNavStart}
            className={`relative flex-1 text-center rounded-[var(--radius-md)] px-2 py-2 sm:px-3 text-meta font-medium motion-sub min-h-[44px] flex items-center justify-center ${communityShellTabFocus} ${
              active
                ? COMMUNITY_SHELL_TAB_ACTIVE
                : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
            }`}
            aria-current={active ? "page" : undefined}
            aria-label={showBadge ? `${t(tab.key)} ${totalUnread} ${t("community_unread")}` : t(tab.key)}
          >
            {t(tab.key)}
            {showBadge && (
              <span className="absolute -top-0.5 -right-0.5 sm:top-1 sm:right-1 min-w-[18px] h-[18px] rounded-full bg-fuchsia-500 flex items-center justify-center text-micro font-bold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
});

/** 移动端底部导航（需在 CommunityPublishProvider 内使用）；onNavStart 实现 200ms 内可感知反馈 */
const MobileBottomNav = memo(function MobileBottomNav({
  pathname,
  t,
  totalUnread,
  onNavStart,
}: {
  pathname: string | null;
  t: (k: string) => string;
  totalUnread: number;
  onNavStart?: () => void;
}) {
  const publish = useCommunityPublish();
  const onFeed =
    pathname === "/community" || pathname === "/community/feed" || (pathname ?? "").startsWith("/community/topic/");
  return (
    <div className="flex items-stretch gap-0.5 rounded-[var(--radius-md)] p-1 bg-slate-800/60 ring-1 ring-ref-cyan/15">
      <Link
        href="/community"
        prefetch={true}
        onPointerDown={onNavStart}
        className={`relative flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${communityShellTabFocus} ${
          onFeed ? COMMUNITY_SHELL_TAB_ACTIVE : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
        }`}
        aria-current={onFeed ? "page" : undefined}
        aria-label={t("community_tab_feed")}
      >
        {t("community_tab_feed")}
      </Link>
      <Link
        href="/community/explore"
        prefetch={true}
        onPointerDown={onNavStart}
        className={`relative flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-0.5 py-2.5 min-h-[44px] text-[0.65rem] sm:text-meta font-medium motion-sub leading-tight text-center ${communityShellTabFocus} ${
          (pathname ?? "").startsWith("/community/explore")
            ? COMMUNITY_SHELL_TAB_ACTIVE
            : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
        }`}
        aria-current={(pathname ?? "").startsWith("/community/explore") ? "page" : undefined}
        aria-label={t("community_tab_explore")}
      >
        {t("community_tab_explore")}
      </Link>
      <Link
        href="/community/messages"
        prefetch={true}
        onPointerDown={onNavStart}
        className={`relative flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${communityShellTabFocus} ${
          (pathname ?? "").startsWith("/community/messages") || (pathname ?? "").startsWith("/community/activity")
            ? COMMUNITY_SHELL_TAB_ACTIVE
            : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
        }`}
        aria-current={
          (pathname ?? "").startsWith("/community/messages") || (pathname ?? "").startsWith("/community/activity")
            ? "page"
            : undefined
        }
        aria-label={totalUnread > 0 ? `${t("community_tab_messages")} ${totalUnread} ${t("community_unread")}` : t("community_tab_messages")}
      >
        {t("community_tab_messages")}
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 rounded-full bg-fuchsia-500 flex items-center justify-center text-micro font-bold text-white">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Link>
      {onFeed ? (
        <form
          className="inline flex-shrink-0"
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const sub = (e.nativeEvent as SubmitEvent).submitter;
            if (sub instanceof HTMLButtonElement) publish?.openPublish(sub);
          }}
        >
          <button
            type="submit"
            className={`flex-shrink-0 w-12 h-12 -my-0.5 rounded-full border-2 border-fuchsia-400/70 bg-fuchsia-500/40 flex items-center justify-center text-white shadow-scifi-fuchsia-fab motion-sub hover:bg-fuchsia-500/60 hover:border-fuchsia-400 ${communityPublishFabFocus}`}
            aria-label={t("community_publish")}
          >
            <span className="text-h4 font-bold leading-none">+</span>
          </button>
        </form>
      ) : (
        <Link
          href="/community?publish=1"
          prefetch={true}
          onPointerDown={onNavStart}
          className={`flex-shrink-0 w-12 h-12 -my-0.5 rounded-full border-2 border-fuchsia-400/70 bg-fuchsia-500/40 flex items-center justify-center text-white shadow-scifi-fuchsia-fab motion-sub hover:bg-fuchsia-500/60 hover:border-fuchsia-400 ${communityPublishFabFocus}`}
          aria-label={t("community_publish")}
        >
          <span className="text-h4 font-bold leading-none">+</span>
        </Link>
      )}
      <Link
        href="/community/friends"
        prefetch={true}
        onPointerDown={onNavStart}
        className={`flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${communityShellTabFocus} ${
          (pathname ?? "").startsWith("/community/friends") ? COMMUNITY_SHELL_TAB_ACTIVE : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
        }`}
        aria-current={(pathname ?? "").startsWith("/community/friends") ? "page" : undefined}
        aria-label={t("community_tab_friends")}
      >
        {t("community_tab_friends")}
      </Link>
      <Link
        href="/community/me"
        prefetch={true}
        onPointerDown={onNavStart}
        className={`flex-1 flex items-center justify-center rounded-[var(--radius-md)] px-1 py-2.5 min-h-[44px] text-meta font-medium motion-sub ${communityShellTabFocus} ${
          (pathname ?? "").startsWith("/community/me") ? COMMUNITY_SHELL_TAB_ACTIVE : "text-slate-300 hover:text-slate-200 hover:bg-slate-700/60 border border-transparent"
        }`}
        aria-current={(pathname ?? "").startsWith("/community/me") ? "page" : undefined}
        aria-label={t("community_tab_me")}
      >
        {t("community_tab_me")}
      </Link>
    </div>
  );
});

/** 壳层内容：须在 CommunityAuthProvider 内以按登录态拉取会话未读（避免匿名用户反复请求会话 API）。 */
function CommunityLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineRecovery, setShowOnlineRecovery] = useState(false);
  const [showTabProgress, setShowTabProgress] = useState(false);
  const tabProgressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onlineRecoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: convData, isError: layoutUnreadError, error: layoutUnreadQueryError } = useQuery({
    queryKey: ["community", "conversations", "layoutUnread"],
    queryFn: getConversations,
    enabled: isLoggedIn && !authPending,
    staleTime: 15_000,
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
    }, TAB_NAV_BAR_MS);
  }, []);

  useEffect(() => {
    setShowTabProgress(true);
    if (tabProgressTimerRef.current) clearTimeout(tabProgressTimerRef.current);
    tabProgressTimerRef.current = setTimeout(() => {
      tabProgressTimerRef.current = null;
      setShowTabProgress(false);
    }, TAB_NAV_BAR_MS);
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

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#14100d]">
      <WarmRouteFieldBackdrop />
      <div
        className="fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.32] pointer-events-none"
        aria-hidden
      />
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
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-scifi-gradient-static opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ref-cyan/8 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(252,164,124,0.14),transparent_50%),radial-gradient(circle_at_95%_25%,rgba(249,215,121,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-ref-silhouette-vignette opacity-[0.48]" />
      </div>

      {/* 移动：L1 标题+发现+返回；L2 平台与支持（与主 Tab 底栏分层）。z-[110] 同下 */}
      <header className="md:hidden sticky top-0 z-[110] border-b border-cyan-500/20 bg-slate-900/90 backdrop-blur-md ring-1 ring-ref-coral/10 safe-area-inset-t">
        <div className="px-3 py-2 flex items-center justify-between gap-2 min-h-[44px]">
          <Link
            href="/community"
            className={`${touchTargetLink44Classes} shrink-0 text-body font-semibold text-cyan-200 ${communityHeaderInlineFocus}`}
          >
            {t("community_title")}
          </Link>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              href="/community/explore"
              className={`${touchTargetLink44Classes} text-meta text-cyan-300 hover:text-cyan-100 motion-sub underline-offset-2 ${communityHeaderInlineFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <Link
              href="/"
              className={`${touchTargetLink44Classes} text-meta text-slate-300 hover:text-cyan-100 ${communityHeaderInlineFocus}`}
            >
              {t("community_back")}
            </Link>
          </div>
        </div>
        <div className="border-t border-cyan-500/15 bg-slate-900/85 px-3 py-1.5">
          <nav aria-label={t("community_nav_support_aria")} className="flex flex-wrap items-center justify-end">
            <CommunitySupportMenu size="sm" />
          </nav>
        </div>
      </header>

      {/* 桌面：L1 全宽主 Tab；L2 分隔线下的平台与支持（非与 Tab 并排同级视觉） */}
      <header className="hidden md:block sticky top-0 z-[110] relative border-b border-cyan-500/30 bg-slate-900/90 backdrop-blur-md ring-1 ring-ref-cyan/10 safe-area-inset-t">
        {showTabProgress && (
          <div className="absolute left-0 top-0 right-0 h-0.5 bg-cyan-400/90 z-[1]" role="progressbar" aria-valuenow={undefined} aria-label={t("common_loading") || "Loading"} />
        )}
        <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4">
          <nav aria-label={t("community_nav_tabs_aria")}>
            <TabLinks pathname={pathname} t={t} totalUnread={totalUnread} onNavStart={onTabNavStart} className="w-full" />
          </nav>
          <nav
            aria-label={t("community_nav_support_aria")}
            className="mt-2 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-end"
          >
            <CommunitySupportMenu onNavStart={onTabNavStart} size="md" />
          </nav>
        </div>
      </header>

      <div
        className={`relative z-10 isolate pb-20 md:pb-0 ${!isOnline || showOnlineRecovery ? "pt-10" : ""}`}
      >
        {children}
      </div>

      {/* 移动端：底部 Tab 导航（动态/消息/发布/好友/我），z-[110] 确保在发布弹窗遮罩留白区内可点击；pointerdown 即显示顶栏进度条，满足 200ms 内可感知反馈 */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[110] relative border-t border-cyan-500/30 bg-slate-900/95 backdrop-blur-md safe-area-pb ring-1 ring-ref-coral/10"
        aria-label={t("community_nav_tabs_aria")}
      >
        {showTabProgress && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-cyan-400/90" role="progressbar" aria-valuenow={undefined} aria-label={t("common_loading") || "Loading"} />
        )}
        <div className="max-w-4xl mx-auto px-2 py-2 relative">
          <MobileBottomNav pathname={pathname} t={t} totalUnread={totalUnread} onNavStart={onTabNavStart} />
        </div>
      </nav>
    </div>
  );
}

/** 31 §5.1：L1 主 Tab（动态/发现/消息/好友/我）；L2「帮助与支持」下拉（建议与反馈+帮助中心+社区规范）；费路由见 /help、/traveltrust、页脚。52 §7.5 / 13 宪法：Tab 切换可感知反馈。 */
export default function CommunityRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <CommunityPublishProvider>
      <CommunityAuthProvider>
        <CommunityLayoutInner>{children}</CommunityLayoutInner>
      </CommunityAuthProvider>
    </CommunityPublishProvider>
  );
}
