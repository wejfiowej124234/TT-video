"use client";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

import { type FormEvent } from "react";
import Link from "next/link";
import type { CommunityUserItem } from "@/lib/communityMockData";
import { CommunityFriendsListSkeleton } from "@/components/community/CommunityFriendsListSkeleton";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { CommunityFriendsRelationRow } from "./CommunityFriendsRelationRow";
import type { FriendsTab } from "./communityFriendsPageTypes";

export function CommunityFriendsRelationsPanel({
  tab,
  currentKeyLabel,
  loading,
  followingList,
  t,
  msgHref,
  unfollowPendingId,
  addRequestPendingId,
  addRequestSent,
  handleUnfollow,
  handleAddFriendRequest,
}: {
  tab: FriendsTab;
  currentKeyLabel: string;
  loading: boolean;
  followingList: CommunityUserItem[];
  t: (k: string) => string;
  msgHref: (userId: string) => string;
  unfollowPendingId: string | null;
  addRequestPendingId: string | null;
  addRequestSent: Set<string>;
  handleUnfollow: (user: CommunityUserItem) => void;
  handleAddFriendRequest: (user: CommunityUserItem) => void;
}) {
  if (loading) {
    return (
      <section
        className={TT_COMMUNITY_PAGE_L5.panel}
        aria-label={t(currentKeyLabel)}
      >
        <div role="status" aria-label={t("common_loading")}>
          <CommunityFriendsListSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className={TT_COMMUNITY_PAGE_L5.panel} aria-label={t(currentKeyLabel)}>
      {followingList.length === 0 ? (
        <div className="mx-3 sm:mx-4 my-4 rounded-[var(--radius-md)] border border-dashed border-ref-sun/28 bg-ink-900/40 px-5 py-10 sm:px-6 sm:py-12 text-center">
          <p className="text-body text-slate-200 mb-4">{t("community_friends_empty")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/community"
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("community_tab_feed")}
            </Link>
            <Link
              href="/community/explore"
              className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
            >
              {t("community_explore_title")}
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-slate-600/50">
          {followingList.map((user) => (
            <CommunityFriendsRelationRow
              key={user.id}
              user={user}
              tab={tab}
              t={t}
              msgHref={msgHref(user.id)}
              unfollowPendingId={unfollowPendingId}
              addRequestPendingId={addRequestPendingId}
              addRequestSent={addRequestSent}
              onUnfollowSubmit={(e: FormEvent) => {
                e.preventDefault();
                handleUnfollow(user);
              }}
              onAddFriendSubmit={(e: FormEvent) => {
                e.preventDefault();
                handleAddFriendRequest(user);
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
