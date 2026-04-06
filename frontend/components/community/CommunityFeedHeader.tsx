"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import {
  communityCardLinkFocus,
  communityCyanPillFocus,
  communityFuchsiaPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";

export interface CommunityFeedHeaderProps {
  t: (key: string) => string;
  onRefresh: () => void;
}

/** 社区页顶部：标题、反馈入口、消息、刷新、返回 */
export default function CommunityFeedHeader({ t, onRefresh }: CommunityFeedHeaderProps) {
  return (
    <header
      className="rounded-[var(--radius-md)] border border-cyan-400/40 bg-slate-900/60 backdrop-blur-md px-4 py-4 sm:px-6 sm:py-5 mb-4 shadow-scifi-banner-strong motion-sub hover:border-cyan-400/60 hover:shadow-scifi-hover-strong"
      aria-label={t("community_title")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h2 font-bold bg-gradient-to-r from-cyan-300 via-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
            {t("community_title")}
          </h1>
          <p className="text-small text-slate-300 mt-0.5">{t("community_subtitle")}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href="/community/explore"
              className={`inline-flex min-h-[44px] items-center justify-center text-meta text-cyan-300 hover:text-cyan-100 motion-sub underline-offset-2 hover:underline ${communityCardLinkFocus}`}
            >
              {t("community_explore_title")}
            </Link>
            <Link
              href="/terms/community-guidelines"
              className={`inline-flex min-h-[44px] items-center justify-center text-meta text-slate-400 hover:text-cyan-100 motion-sub underline-offset-2 hover:underline ${communityCardLinkFocus}`}
            >
              {t("community_guidelines")}
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/community/feedback"
            className={`rounded-full border border-fuchsia-500/50 bg-fuchsia-500/20 px-3 py-1.5 text-meta font-medium text-fuchsia-300 hover:text-fuchsia-100 hover:bg-fuchsia-500/30 motion-sub inline-flex min-h-[44px] items-center justify-center gap-1.5 ${communityFuchsiaPillFocus}`}
            title={t("community_tab_feedback")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            {t("community_tab_feedback")}
          </Link>
          <Link
            href="/community/messages"
            className={`rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub inline-flex min-h-[44px] items-center justify-center gap-1.5 ${communitySlatePillFocus}`}
            title={t("community_activity_hint")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            {t("community_activity_hint")}
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
              className={`rounded-full border border-slate-500/60 bg-slate-800/60 px-3 py-1.5 text-meta text-slate-300 hover:bg-slate-700/60 motion-sub inline-flex min-h-[44px] items-center justify-center gap-1.5 ${communitySlatePillFocus}`}
              aria-label={t("community_refresh")}
              title={t("community_refresh")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {t("community_refresh")}
            </button>
          </form>
          <Link
            href="/"
            className={`rounded-full border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub inline-flex min-h-[44px] items-center justify-center ${communityCyanPillFocus}`}
          >
            {t("community_back")}
          </Link>
        </div>
      </div>
    </header>
  );
}
