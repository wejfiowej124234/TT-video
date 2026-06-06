"use client";

import type { FormEvent } from "react";
import type { CommunityPostUserVisibility } from "@/lib/communityMockData";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import { USER_PROFILE_POSTS_VIS_TABS } from "./communityUserPageModel";

type TFn = (key: string) => string;

export function CommunityUserPostsVisibilityNav(props: {
  t: TFn;
  postsVisFilter: "all" | CommunityPostUserVisibility;
  onSelectVis: (key: "all" | CommunityPostUserVisibility) => void;
}) {
  const { t, postsVisFilter, onSelectVis } = props;

  return (
    <nav
      className="mb-4 flex flex-wrap gap-2"
      role="tablist"
      aria-label={t("community_me_posts_filters_aria")}
    >
      {USER_PROFILE_POSTS_VIS_TABS.map(({ key, labelKey }) => (
        <form
          key={key}
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onSelectVis(key);
          }}
        >
          <button
            type="submit"
            role="tab"
            aria-selected={postsVisFilter === key}
            className={`px-3 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center rounded-full border ${communityShellTabFocus} ${
              postsVisFilter === key
                ? TT_COMMUNITY_PAGE_L5.innerTabActive
                : TT_COMMUNITY_PAGE_L5.innerTabIdle
            }`}
          >
            {t(labelKey)}
          </button>
        </form>
      ))}
    </nav>
  );
}
