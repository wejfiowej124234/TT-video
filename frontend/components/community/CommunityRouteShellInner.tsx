import React from "react";
import Link from "next/link";
import { CommunitySupportMenu } from "@/components/community/CommunitySupportMenu";
import {
  TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_HEADER_LINK_MUTED,
  TT_MARKETING_DARK_ROUTE_HEADER_LINK_FOCUS,
  TT_MARKETING_DARK_ROUTE_HEADER_LINK_PRIMARY,
  TT_MARKETING_DARK_ROUTE_HEADER_SUPPORT_RAIL_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_HEADER_TITLE,
  TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_MOBILE_HEADER_COMMUNITY_PREMIUM,
  TT_MARKETING_DARK_ROUTE_TAB_PROGRESS,
  TT_MARKETING_HEADER_INNER_FRAME,
} from "@/lib/uiSystem";
import { darkRoutePageShellClass, resolveCommunityBackdropSurface } from "@/lib/marketingDarkPremiumBg";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import CommunityAmbientBackdrop from "@/components/community/CommunityAmbientBackdrop";
import { CommunityRouteShellTabLinks } from "./CommunityRouteShellTabLinks";
import { CommunityRouteShellMobileBottomNav } from "./CommunityRouteShellMobileBottomNav";
import { useCommunityRouteShellInner } from "./useCommunityRouteShellInner";

/** 壳层内容：须在 CommunityAuthProvider 内。 */
export function CommunityRouteShellInner({ children }: { children: React.ReactNode }) {
  const { pathname, t, isOnline, showOnlineRecovery, showTabProgress, totalUnread, onTabNavStart } =
    useCommunityRouteShellInner();

  const communitySurface = resolveCommunityBackdropSurface();

  return (
    <div
      className={darkRoutePageShellClass(communitySurface)}
      data-tt-ui-generation="v2"
      data-tt-marketing-dark-route-shell="1"
      data-tt-community-dark-surface={communitySurface}
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
            className={`${touchTargetLink44Classes} ${TT_MARKETING_DARK_ROUTE_HEADER_TITLE} ${TT_MARKETING_DARK_ROUTE_HEADER_LINK_FOCUS}`}
          >
            {t("community_title")}
          </Link>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              href="/community/explore"
              className={`${touchTargetLink44Classes} ${TT_MARKETING_DARK_ROUTE_HEADER_LINK_PRIMARY} ${TT_MARKETING_DARK_ROUTE_HEADER_LINK_FOCUS}`}
            >
              {t("community_explore_title")}
            </Link>
            <Link
              href="/"
              className={`${touchTargetLink44Classes} ${TT_MARKETING_DARK_ROUTE_HEADER_LINK_MUTED} ${TT_MARKETING_DARK_ROUTE_HEADER_LINK_FOCUS}`}
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
          <div
            className={TT_MARKETING_DARK_ROUTE_TAB_PROGRESS}
            role="progressbar"
            aria-valuenow={undefined}
            aria-label={t("common_loading") || "Loading"}
          />
        )}
        <div className={`${TT_MARKETING_HEADER_INNER_FRAME} py-2.5 min-h-[3.25rem]`}>
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

      <div className={`relative z-0 pb-20 md:pb-0 md:pt-3 lg:pt-4 ${!isOnline || showOnlineRecovery ? "pt-10" : ""}`}>
        {children}
      </div>

      {/* 移动端：底部 Tab 导航（动态/消息/发布/好友/我），z-[110] 确保在发布弹窗遮罩留白区内可点击；pointerdown 即显示顶栏进度条，满足 200ms 内可感知反馈 */}
      <nav
        className={TT_MARKETING_DARK_ROUTE_MOBILE_BOTTOM_NAV_COMMUNITY_PREMIUM}
        aria-label={t("community_nav_tabs_aria")}
      >
        {showTabProgress && (
          <div
            className={TT_MARKETING_DARK_ROUTE_TAB_PROGRESS}
            role="progressbar"
            aria-valuenow={undefined}
            aria-label={t("common_loading") || "Loading"}
          />
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
