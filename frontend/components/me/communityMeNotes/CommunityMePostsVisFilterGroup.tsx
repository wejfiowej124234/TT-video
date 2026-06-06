"use client";

import { communityCyanPillFocus, communityShellTabFocus } from "@/lib/communityA11yFocus";
import {
  COMMUNITY_ME_POSTS_VIS_TABS,
  type CommunityMePostsVisFilterKey,
} from "@/lib/communityMePostsVisFilters";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

type TFunc = (k: string) => string;

/** 我的帖子可见性筛选 · 独立页（ref-sun tab）与 Hub 抽屉（cyan tab）共用逻辑 */
export function CommunityMePostsVisFilterGroup({
  t,
  postsVisFilter,
  onSelect,
  variant,
}: {
  t: TFunc;
  postsVisFilter: CommunityMePostsVisFilterKey;
  onSelect: (key: CommunityMePostsVisFilterKey) => void;
  variant: "page" | "hub";
}) {
  const hubActive =
    "rounded-full border border-cyan-400/50 bg-cyan-500/20 text-cyan-100 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
  const hubIdle =
    "rounded-full border border-slate-600/50 bg-ink-800/60 text-slate-300 hover:border-cyan-500/35 hover:text-cyan-100";

  return (
    <div
      className="mb-4 flex flex-wrap gap-2"
      role="group"
      aria-label={t("community_me_posts_filters_aria")}
    >
      {COMMUNITY_ME_POSTS_VIS_TABS.map(({ key, labelKey }) => (
        <button
          key={key}
          type="button"
          aria-pressed={postsVisFilter === key}
          onClick={() => onSelect(key)}
          className={`px-3 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${
            variant === "hub" ? communityCyanPillFocus : communityShellTabFocus
          } ${
            variant === "hub"
              ? postsVisFilter === key
                ? hubActive
                : hubIdle
              : postsVisFilter === key
                ? TT_COMMUNITY_PAGE_L5.innerTabActive
                : TT_COMMUNITY_PAGE_L5.innerTabIdle
          }`}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
