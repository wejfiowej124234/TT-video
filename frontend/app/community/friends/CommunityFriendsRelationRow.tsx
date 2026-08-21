"use client";

import { type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  communityStoredRolePillClassName,
} from "@/components/community/communityFeedMappers";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import {
  communityAvatarLinkFocus,
  communityCardLinkFocus,
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import type { CommunityUserItem } from "@/lib/communityMockData";
import type { FriendsTab } from "./communityFriendsPageTypes";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityFriendsRelationRow({
  user,
  tab,
  t,
  msgHref,
  unfollowPendingId,
  addRequestPendingId,
  addRequestSent,
  onUnfollowSubmit,
  onAddFriendSubmit,
}: {
  user: CommunityUserItem;
  tab: FriendsTab;
  t: (k: string) => string;
  msgHref: string;
  unfollowPendingId: string | null;
  addRequestPendingId: string | null;
  addRequestSent: Set<string>;
  onUnfollowSubmit: (e: FormEvent) => void;
  onAddFriendSubmit: (e: FormEvent) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <Link
        href={`/community/user/${user.id}`}
        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-ref-sun/22 motion-sub hover:ring-ref-sun/40 ${communityAvatarLinkFocus}`}
        aria-label={user.nickname}
      >
        {user.avatar_url?.trim() ? (
          <Image
            src={communityMediaAbsoluteUrlForRender(user.avatar_url.trim())}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
            unoptimized={communityMediaNextImageUnoptimized(
              communityMediaAbsoluteUrlForRender(user.avatar_url.trim())
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-ink-700 text-meta font-medium text-ref-sun">
            {user.nickname.slice(0, 1)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/community/user/${user.id}`}
            className={`inline-flex min-h-[44px] max-w-full min-w-0 items-center justify-start truncate text-body font-medium text-slate-200 hover:text-ref-coral motion-sub rounded-sm ${communityCardLinkFocus}`}
          >
            {user.nickname}
          </Link>
          <span className={`rounded-full px-2 py-0.5 text-meta ${communityStoredRolePillClassName(user.role)}`}>
            {t(communityStoredRoleLabelI18nKey(user.role))}
          </span>
          {user.isEscrowGuide && String(user.role ?? "").toLowerCase() !== "guide" ? (
            <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-meta text-warning/90">
              {t("community_role_guide")}
            </span>
          ) : null}
        </div>
        {user.wallet ? (
          <p className="mt-0.5 truncate text-meta font-mono text-slate-400" title={user.wallet}>
            {user.wallet}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {tab === "following" && (
          <form className="inline" onSubmit={onUnfollowSubmit}>
            <button
              type="submit"
              disabled={unfollowPendingId === user.id}
              aria-busy={unfollowPendingId === user.id ? true : undefined}
              className={`rounded-full border border-slate-500/60 bg-ink-700/50 px-3 py-1.5 text-meta text-slate-300 hover:bg-ink-600/50 motion-sub disabled:opacity-60 disabled:cursor-wait min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
            >
              {unfollowPendingId === user.id ? t("common_loading") : t("community_unfollow")}
            </button>
          </form>
        )}
        {tab === "followers" && (
          <form className="inline" onSubmit={onAddFriendSubmit}>
            <button
              type="submit"
              disabled={addRequestSent.has(user.id) || addRequestPendingId === user.id}
              aria-busy={addRequestPendingId === user.id ? true : undefined}
              className={`${TT_COMMUNITY_PAGE_L5.pillCompact} disabled:opacity-70 disabled:cursor-wait ${communityCyanPillFocus}`}
            >
              {addRequestPendingId === user.id
                ? t("common_loading")
                : addRequestSent.has(user.id)
                  ? t("community_request_sent")
                  : t("community_friends_add")}
            </button>
          </form>
        )}
        <Link
          href={msgHref}
          className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCyanPillFocus}`}
        >
          {t("community_chat")}
        </Link>
        {(user.role === "guide" || user.isEscrowGuide) && (
          <Link href={marketHrefForCommunityUser(user.id)} className={COMMUNITY_BOOK_GUIDE_CTA_CLASS}>
            {t("community_book_guide_cta")}
          </Link>
        )}
      </div>
    </li>
  );
}
