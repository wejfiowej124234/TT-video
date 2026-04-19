"use client";

import Link from "next/link";
import { useId } from "react";
import { FOCUS_RING } from "./constants";
import { communityCardLinkFocus } from "@/lib/communityA11yFocus";

/** 与动态页右侧「热门目的地」列表行视觉一致（CommunityFeedDesktopAside） */
const ASIDE_LIST_ROW =
  `block w-full rounded-[var(--radius-md)] px-2.5 py-2 text-left text-meta text-slate-300 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent motion-sub ${communityCardLinkFocus}`;

const ASIDE_LIST_ROW_GUIDE =
  `block w-full rounded-[var(--radius-md)] px-2.5 py-2 text-left text-meta text-success/95 border border-transparent hover:bg-success/10 hover:border-success/35 motion-sub ${communityCardLinkFocus}`;

export interface MeQuickLinksSectionProps {
  t: (k: string) => string;
  /** 向导账号显示「向导工作台」链至 `/guide`（07 §五 5.0 / 05） */
  showGuideHub?: boolean;
  /**
   * 社区「个人中心」内：与同页 Tab / 社区快捷格去重，隐藏信任中心 pill、我的帖子/收藏/举报。
   */
  compactForCommunityMe?: boolean;
  /** 抽屉内：无卡片外框与下边距 */
  embedded?: boolean;
  /** 与外层标题合并时隐藏本组件 h2 */
  hideHeading?: boolean;
  /** pills：原圆角标签；asideList：与动态页侧栏目的地相同的纵向密列表 */
  presentation?: "pills" | "asideList";
  /** 抽屉内点击任一链接触发（如关闭面板） */
  onLinkClick?: () => void;
}

export default function MeQuickLinksSection({
  t,
  showGuideHub,
  compactForCommunityMe,
  embedded = false,
  hideHeading = false,
  presentation = "pills",
  onLinkClick,
}: MeQuickLinksSectionProps) {
  const titleId = useId();
  const shellClass =
    presentation === "asideList"
      ? embedded
        ? "border-0 bg-transparent shadow-none ring-0 mb-0 px-0 py-0"
        : "rounded-[var(--radius-xl)] border border-cyan-500/30 bg-slate-900/75 backdrop-blur-md shadow-scifi-panel overflow-hidden mb-0 px-0 py-0"
      : embedded
        ? "border-0 bg-transparent shadow-none ring-0 mb-0 px-0 py-0 backdrop-blur-0"
        : "rounded-[var(--radius-md)] border border-slate-600/60 bg-slate-900/50 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 mb-4 sm:mb-6 ring-1 ring-white/5";

  if (presentation === "asideList") {
    return (
      <section className={shellClass} aria-labelledby={titleId}>
        {hideHeading ? (
          <span id={titleId} className="sr-only">
            {t("me_quickLinks")}
          </span>
        ) : (
          <h2 id={titleId} className="px-2.5 pt-2 pb-1.5 text-meta font-medium text-slate-300">
            {t("me_quickLinks")}
          </h2>
        )}
        <ul className="space-y-0.5" aria-label={t("me_quickLinks")}>
          {showGuideHub ? (
            <li>
              <Link href="/guide" onClick={onLinkClick} className={ASIDE_LIST_ROW_GUIDE}>
                {t("guide_dashboard_title")}
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/trust" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("trust_nav_short")}
            </Link>
          </li>
          <li>
            <Link href="/orders" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("nav_orders")}
            </Link>
          </li>
          <li>
            <Link href="/pay" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("header_payHub")}
            </Link>
          </li>
          <li>
            <Link href="/market" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("header_market")}
            </Link>
          </li>
          <li>
            <Link href="/guides" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("nav_guides")}
            </Link>
          </li>
          <li>
            <Link href="/community" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("header_community")}
            </Link>
          </li>
          {compactForCommunityMe ? null : (
            <>
              <li>
                <Link href="/community/me/posts" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
                  {t("community_me_my_posts")}
                </Link>
              </li>
              <li>
                <Link href="/community/me/collects" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
                  {t("community_me_my_collects")}
                </Link>
              </li>
              <li>
                <Link href="/community/me/reports" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
                  {t("community_me_my_reports")}
                </Link>
              </li>
            </>
          )}
          <li>
            <Link href="/did-rank" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("didRank_title")}
            </Link>
          </li>
          <li>
            <Link href="/community/feedback" onClick={onLinkClick} className={ASIDE_LIST_ROW}>
              {t("me_link_feedback")}
            </Link>
          </li>
        </ul>
        <p className="px-2.5 pt-2 text-[0.65rem] leading-snug text-slate-500">{t("me_communityHint")}</p>
      </section>
    );
  }

  return (
    <section className={shellClass} aria-labelledby={titleId}>
      {hideHeading ? (
        <span id={titleId} className="sr-only">
          {t("me_quickLinks")}
        </span>
      ) : (
        <h2 id={titleId} className="text-body font-semibold text-slate-200 mb-2">
          {t("me_quickLinks")}
        </h2>
      )}
      <div className="flex flex-wrap gap-2">
        {showGuideHub ? (
          <Link
            href="/guide"
            onClick={onLinkClick}
            className={`rounded-full border border-success/50 bg-success/15 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/25 motion-sub ${FOCUS_RING}`}
          >
            {t("guide_dashboard_title")}
          </Link>
        ) : null}
        <Link
          href="/trust"
          onClick={onLinkClick}
          className={`rounded-full border border-emerald-400/45 bg-emerald-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/18 motion-sub ${FOCUS_RING}`}
        >
          {t("trust_nav_short")}
        </Link>
        <Link
          href="/orders"
          onClick={onLinkClick}
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("nav_orders")}
        </Link>
        <Link
          href="/pay"
          onClick={onLinkClick}
          className={`rounded-full border border-success/45 bg-success/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_payHub")}
        </Link>
        <Link
          href="/market"
          onClick={onLinkClick}
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_market")}
        </Link>
        <Link
          href="/guides"
          onClick={onLinkClick}
          className={`rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("nav_guides")}
        </Link>
        <Link
          href="/community"
          onClick={onLinkClick}
          className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
        >
          {t("header_community")}
        </Link>
        {compactForCommunityMe ? null : (
          <Link
            href="/community/me/posts"
            onClick={onLinkClick}
            className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
          >
            {t("community_me_my_posts")}
          </Link>
        )}
        {compactForCommunityMe ? null : (
          <Link
            href="/community/me/collects"
            onClick={onLinkClick}
            className={`rounded-full border border-fuchsia-400/50 bg-fuchsia-500/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/20 motion-sub ${FOCUS_RING}`}
          >
            {t("community_me_my_collects")}
          </Link>
        )}
        {compactForCommunityMe ? null : (
          <Link
            href="/community/me/reports"
            onClick={onLinkClick}
            className={`rounded-full border border-warning/40 bg-warning/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-warning/95 hover:bg-warning/20 motion-sub ${FOCUS_RING}`}
          >
            {t("community_me_my_reports")}
          </Link>
        )}
        <Link
          href="/did-rank"
          onClick={onLinkClick}
          className={`rounded-full border border-warning/40 bg-warning/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-warning/90 hover:bg-warning/20 motion-sub ${FOCUS_RING}`}
        >
          {t("didRank_title")}
        </Link>
        <Link
          href="/community/feedback"
          onClick={onLinkClick}
          className={`rounded-full border border-success/45 bg-success/10 px-3 py-2 min-h-[44px] inline-flex items-center justify-center text-meta text-success/95 hover:bg-success/20 motion-sub ${FOCUS_RING}`}
        >
          {t("me_link_feedback")}
        </Link>
      </div>
      <p className="text-meta text-slate-300/95 mt-2">{t("me_communityHint")}</p>
    </section>
  );
}
