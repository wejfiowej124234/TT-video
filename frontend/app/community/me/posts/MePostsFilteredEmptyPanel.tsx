import Link from "next/link";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import {
  communityMePostsVisFilterLabelKey,
  type CommunityMePostsVisFilterKey,
} from "@/lib/communityMePostsVisFilters";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

/** 可见性筛选无结果 · 与 orders filter empty 同口径 */
export function MePostsFilteredEmptyPanel({
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
      className="rounded-[var(--radius-md)] border border-dashed border-ref-sun/30 bg-ink-900/45 px-5 py-10 text-center space-y-4"
      role="region"
      aria-label={t("community_me_posts_filter_empty", { filter: filterLabel })}
    >
      <p className="text-body text-slate-200">{t("community_me_posts_filter_empty", { filter: filterLabel })}</p>
      <p className="text-meta text-slate-400 max-w-md mx-auto">{t("community_me_posts_filter_empty_sub")}</p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <button
          type="button"
          onClick={onClearFilter}
          className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
        >
          {t("community_me_posts_filter_all")}
        </button>
        <Link href="/community?publish=1" className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCyanPillFocus}`}>
          {t("community_me_posts_link_publish")}
        </Link>
      </div>
    </div>
  );
}
