"use client";

import type { FormEvent } from "react";

export interface CommunityFeedMainPublishWideEntryProps {
  t: (key: string) => string;
  onSubmitPublishEntry: (e: FormEvent<HTMLFormElement>) => void;
}

export default function CommunityFeedMainPublishWideEntry({
  t,
  onSubmitPublishEntry,
}: CommunityFeedMainPublishWideEntryProps) {
  return (
    <form className="mb-4 block w-full" onSubmit={onSubmitPublishEntry}>
      <button
        type="submit"
        data-testid="community-feed-publish-entry"
        data-tt-community-feed-publish-entry="1"
        className="w-full rounded-[var(--radius-xl)] border border-ref-sun/35 bg-ink-900/70 backdrop-blur-md px-4 py-3 flex items-center gap-3 text-left motion-sub hover:border-ref-sun/45 hover:bg-ink-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 min-h-[52px]"
        aria-label={t("community_publish")}
        title={t("community_publish_entry_hint")}
      >
        <span
          className="flex-shrink-0 min-h-[44px] min-w-[44px] h-11 w-11 rounded-full bg-ref-sun/12 border border-ref-sun/35 flex items-center justify-center text-ref-sun/90"
          aria-hidden
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </span>
        <span className="flex-1 text-body text-slate-300 truncate text-left">{t("community_publish_entry_placeholder")}</span>
        <span className="flex-shrink-0 text-meta text-ref-sun/90">+ {t("community_publish")}</span>
      </button>
    </form>
  );
}
