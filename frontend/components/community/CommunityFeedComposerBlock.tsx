"use client";

import type { FormEvent } from "react";
import { TT_COMMUNITY_FEED_ACTION } from "@/lib/marketingUi";

export interface CommunityFeedComposerBlockProps {
  t: (key: string) => string;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onPublishSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

/** 发帖 + 搜索 · 单外框 L5 条（桌面横排 · 移动纵排 · 无套娃双黑框） */
export function CommunityFeedComposerBlock({
  t,
  searchQuery,
  setSearchQuery,
  onPublishSubmit,
}: CommunityFeedComposerBlockProps) {
  return (
    <div className={TT_COMMUNITY_FEED_ACTION.feedComposerShell}>
      <div className={TT_COMMUNITY_FEED_ACTION.feedComposerInner}>
        <form className={TT_COMMUNITY_FEED_ACTION.composerFormWrap} onSubmit={onPublishSubmit}>
          <button
            type="submit"
            className={TT_COMMUNITY_FEED_ACTION.composerTriggerInShell}
            aria-label={t("community_publish")}
            title={t("community_publish_entry_hint")}
            data-testid="community-feed-publish-entry"
            data-tt-community-feed-publish-entry="1"
          >
            <span className={TT_COMMUNITY_FEED_ACTION.composerAvatar} aria-hidden>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </span>
            <span className="flex-1 text-body text-slate-300 truncate text-left">
              {t("community_publish_entry_placeholder")}
            </span>
            <span className={TT_COMMUNITY_FEED_ACTION.composerPublishLabel}>+ {t("community_publish")}</span>
          </button>
        </form>
        <div className={TT_COMMUNITY_FEED_ACTION.feedComposerDividerH} aria-hidden />
        <div className={TT_COMMUNITY_FEED_ACTION.feedComposerDividerV} aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("community_search_placeholder")}
          className={TT_COMMUNITY_FEED_ACTION.searchInShell}
          aria-label={t("community_search_placeholder")}
        />
      </div>
    </div>
  );
}
