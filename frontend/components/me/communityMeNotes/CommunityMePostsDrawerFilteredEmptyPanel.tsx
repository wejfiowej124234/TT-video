"use client";

import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import {
  communityMePostsVisFilterLabelKey,
  type CommunityMePostsVisFilterKey,
} from "@/lib/communityMePostsVisFilters";

/** Hub 抽屉 · 可见性筛选无结果（cyan 壳 · 与抽屉空态同族） */
export function CommunityMePostsDrawerFilteredEmptyPanel({
  t,
  postsVisFilter,
  onClearFilter,
}: {
  t: (k: string, vars?: Record<string, string>) => string;
  postsVisFilter: CommunityMePostsVisFilterKey;
  onClearFilter: () => void;
}) {
  const filterLabel = t(communityMePostsVisFilterLabelKey(postsVisFilter));
  return (
    <div
      className="rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-5 py-8 text-center space-y-3"
      role="region"
      aria-label={t("community_me_posts_filter_empty", { filter: filterLabel })}
    >
      <p className="text-body text-slate-200">{t("community_me_posts_filter_empty", { filter: filterLabel })}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_posts_filter_empty_sub")}</p>
      <button
        type="button"
        onClick={onClearFilter}
        className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
      >
        {t("community_me_posts_filter_all")}
      </button>
    </div>
  );
}
