import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityFeedFilterBarSearchProps = {
  t: LocaleTranslateFn;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onSearchApplyServerTag?: () => void;
  searchAriaDescribedBy: string | undefined;
  searchTopicHintId: string;
  searchTopicLimitNoteId: string;
  searchTopicOverLimitId: string;
  topicTagOverApiLimit: boolean;
  tagQueryMaxLen: number;
};

export function CommunityFeedFilterBarSearch({
  t,
  searchQuery,
  setSearchQuery,
  onSearchApplyServerTag,
  searchAriaDescribedBy,
  searchTopicHintId,
  searchTopicLimitNoteId,
  searchTopicOverLimitId,
  topicTagOverApiLimit,
  tagQueryMaxLen,
}: CommunityFeedFilterBarSearchProps) {
  return (
    <div className="mb-4">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || !onSearchApplyServerTag) return;
          e.preventDefault();
          onSearchApplyServerTag();
        }}
        placeholder={t("community_search_placeholder")}
        className="w-full rounded-[var(--radius-xl)] border border-ref-sun/30 bg-ink-900/80 px-4 py-2.5 text-small text-slate-200 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950"
        aria-label={t("community_search_placeholder")}
        aria-describedby={searchAriaDescribedBy}
      />
      {onSearchApplyServerTag ? (
        <p id={searchTopicHintId} className="mt-1.5 text-meta leading-snug text-slate-500 line-clamp-2">
          {t("community_search_enter_topic_hint")}
          {topicTagOverApiLimit ? (
            <>
              {" · "}
              <span id={searchTopicOverLimitId} className="text-warning/95" role="status">
                {t("community_search_topic_tag_over_limit", { n: tagQueryMaxLen })}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
