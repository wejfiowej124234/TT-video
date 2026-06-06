"use client";

import { type FormEvent } from "react";
import { communityShellTabFocus } from "@/lib/communityA11yFocus";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";
import type { FriendsTab } from "./communityFriendsPageTypes";

export function CommunityFriendsMainTabs({
  tabRows,
  tab,
  t,
  selectTab,
}: {
  tabRows: { key: FriendsTab; keyLabel: string }[];
  tab: FriendsTab;
  t: (k: string) => string;
  selectTab: (key: FriendsTab) => void;
}) {
  return (
    <div className="flex gap-2 mb-4 rounded-[var(--radius-md)] p-1 bg-ink-800/60 flex-wrap">
      {tabRows.map(({ key, keyLabel }) => (
        <form
          key={key}
          className="inline"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            selectTab(key);
          }}
        >
          <button
            type="submit"
            className={`px-3 py-2 text-meta font-medium motion-sub min-h-[44px] inline-flex items-center justify-center ${communityShellTabFocus} ${
              tab === key ? TT_COMMUNITY_PAGE_L5.innerTabActive : TT_COMMUNITY_PAGE_L5.innerTabIdle
            }`}
          >
            {t(keyLabel)}
          </button>
        </form>
      ))}
    </div>
  );
}
