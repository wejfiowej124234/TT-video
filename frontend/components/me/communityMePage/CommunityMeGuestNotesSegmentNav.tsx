"use client";

import { communityMeContentSegmentClass, type CommunityMeUrlTab } from "@/lib/communityMeContentNav";
import { TT_COMMUNITY_ME_PANEL_L5 } from "@/lib/marketingUi";

export default function CommunityMeGuestNotesSegmentNav({
  t,
  showLikesTab,
  segmentGridClass,
  guestLikesActive,
  guestCollectsActive,
  guestCommunityPostsActive,
  guestOrdersActive,
  openNotesPanel,
}: {
  t: (key: string) => string;
  showLikesTab: boolean;
  segmentGridClass: string;
  guestLikesActive: boolean;
  guestCollectsActive: boolean;
  guestCommunityPostsActive: boolean;
  guestOrdersActive: boolean;
  openNotesPanel: (panel: CommunityMeUrlTab) => void;
}) {
  return (
    <nav
      className={TT_COMMUNITY_ME_PANEL_L5.guestNotesShell}
      aria-label={t("community_me_notes_tablist_aria")}
      title={t("community_me_notes_tab_hint")}
    >
      <p className={`${TT_COMMUNITY_ME_PANEL_L5.eyebrowLabel} pt-2`}>
        {t("community_me_eyebrow_notes")}
      </p>
      <ul className={`grid list-none p-0 m-0 gap-0.5 text-center ${segmentGridClass}`}>
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
            className={`w-full ${communityMeContentSegmentClass(guestCollectsActive)}`}
            aria-current={guestCollectsActive ? "page" : undefined}
            onClick={() => openNotesPanel("collects")}
          >
            {t("community_me_tab_collects")}
          </button>
        </li>
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
      </ul>
    </nav>
  );
}
