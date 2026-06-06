"use client";

import type { CommunityMeNotesPanel } from "@/components/me/CommunityMeAccountPanel";
import { communityMeContentSegmentClass } from "@/lib/communityMeContentNav";

type TFunc = (k: string) => string;

/**
 * 访客 Hub 分段：顺序与已登录资料卡「我的内容」一致（社区帖子 → 收藏 → 赞过 → 订单）。
 */
export function CommunityMeGuestNotesSegmentNav({
  t,
  showLikesTab,
  segmentGridClass,
  guestCommunityPostsActive,
  guestCollectsActive,
  guestLikesActive,
  guestOrdersActive,
  openNotesPanel,
}: {
  t: TFunc;
  showLikesTab: boolean;
  segmentGridClass: string;
  guestCommunityPostsActive: boolean;
  guestCollectsActive: boolean;
  guestLikesActive: boolean;
  guestOrdersActive: boolean;
  openNotesPanel: (panel: CommunityMeNotesPanel) => void;
}) {
  return (
    <nav
      className={`rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-800/60 backdrop-blur-md overflow-hidden shadow-scifi-banner ring-1 ring-white/5 p-0.5`}
      aria-label={t("community_me_notes_tablist_aria")}
      title={t("community_me_notes_tab_hint")}
    >
      <ul className={`grid list-none p-0 m-0 gap-0.5 text-center ${segmentGridClass}`}>
        <li className="min-w-0">
          <button
            type="button"
            className={`w-full ${communityMeContentSegmentClass(guestCommunityPostsActive)}`}
            aria-current={guestCommunityPostsActive ? "page" : undefined}
            onClick={() => openNotesPanel("posts")}
          >
            {t("community_me_tab_community_posts")}
          </button>
        </li>
        <li className="min-w-0">
          <button
            type="button"
            className={`w-full ${communityMeContentSegmentClass(guestCollectsActive)}`}
            aria-current={guestCollectsActive ? "page" : undefined}
            onClick={() => openNotesPanel("collects")}
          >
            {t("community_me_tab_collects")}
          </button>
        </li>
        {showLikesTab ? (
          <li className="min-w-0">
            <button
              type="button"
              className={`w-full ${communityMeContentSegmentClass(guestLikesActive)}`}
              aria-current={guestLikesActive ? "page" : undefined}
              onClick={() => openNotesPanel("likes")}
            >
              {t("community_me_tab_liked")}
            </button>
          </li>
        ) : null}
        <li className="min-w-0">
          <button
            type="button"
            className={`w-full ${communityMeContentSegmentClass(guestOrdersActive)}`}
            aria-current={guestOrdersActive ? "page" : undefined}
            onClick={() => openNotesPanel("orders")}
          >
            {t("header_myOrders")}
          </button>
        </li>
      </ul>
    </nav>
  );
}
