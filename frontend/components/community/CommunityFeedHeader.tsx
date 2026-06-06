"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";
import {
  communityCardLinkFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

export interface CommunityFeedHeaderProps {
  t: (key: string) => string;
  onRefresh: () => void;
}

/** 移动 Feed 工具条（桌面副标题在 `CommunityFeedMain` 全宽区，与侧栏顶对齐） */
export default function CommunityFeedHeader({ t, onRefresh }: CommunityFeedHeaderProps) {
  return (
    <header
      className={TT_COMMUNITY_FEED_ACTION.headerToolbarMobile}
      aria-label={t("community_tab_feed")}
    >
      <h1 className={TT_COMMUNITY_FEED_ACTION.headerTitleSrOnly}>{t("community_title")}</h1>
      <div className="min-w-0 flex-1">
        <p className={TT_COMMUNITY_FEED_ACTION.headerSubtitle}>{t("community_subtitle")}</p>
        <div className={`${TT_COMMUNITY_FEED_ACTION.headerExploreRow} mt-1`}>
          <Link href="/community/explore" className={`${TT_COMMUNITY_FEED_ACTION.headerLink} ${communityCardLinkFocus}`}>
            {t("community_explore_title")}
          </Link>
          <Link
            href="/terms/community-guidelines"
            className={`inline-flex min-h-[44px] items-center justify-center text-meta text-slate-400 hover:text-ref-sun/90 motion-sub underline-offset-2 hover:underline ${communityCardLinkFocus}`}
          >
            {t("community_guidelines")}
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        <Link
          href="/community/feedback"
          className={`${TT_COMMUNITY_FEED_ACTION.headerPillGhost} ${communityCardLinkFocus}`}
          title={t("community_tab_feedback")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span className="max-sm:sr-only">{t("community_tab_feedback")}</span>
        </Link>
        <Link
          href="/community/messages"
          className={`${TT_COMMUNITY_FEED_ACTION.headerPillGhost} ${communitySlatePillFocus}`}
          title={t("community_activity_hint")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="max-sm:sr-only">{t("community_activity_hint")}</span>
        </Link>
        <form
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onRefresh();
          }}
        >
          <button
            type="submit"
            className={`${TT_COMMUNITY_FEED_ACTION.headerPillGhost} ${communitySlatePillFocus}`}
            aria-label={t("community_refresh")}
            title={t("community_refresh")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="max-sm:sr-only">{t("community_refresh")}</span>
          </button>
        </form>
        <Link href="/" className={`${TT_COMMUNITY_FEED_ACTION.headerPillGhost} ${communityCardLinkFocus}`}>
          {t("community_back")}
        </Link>
      </div>
    </header>
  );
}
