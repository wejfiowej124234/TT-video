"use client";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

import Link from "next/link";
import Image from "next/image";
import type { FormEvent } from "react";
import type { CommunityPostAuthor } from "@/lib/communityMockData";
import { COMMUNITY_BOOK_GUIDE_CTA_CLASS } from "@/components/community/communityFeedConstants";
import {
  communityMediaAbsoluteUrlForRender,
  communityMediaNextImageUnoptimized,
} from "@/lib/communityMediaClientUrl";
import {
  communityCyanPillFocus,
  communitySlatePillFocus,
} from "@/lib/communityA11yFocus";
import { communityStoredRolePillClassName } from "@/components/community/communityFeedMappers";
import { communityStoredRoleLabelI18nKey } from "@/lib/meRoleDisplay";
import { marketHrefForCommunityUser } from "@/lib/communityMarketDeepLink";
import type { FollowingListFetch } from "./communityUserPageModel";

type TFn = (key: string) => string;

export function CommunityUserProfileHeader(props: {
  t: TFn;
  id: string;
  profileAuthor: CommunityPostAuthor | undefined;
  displayName: string;
  loading: boolean;
  userPostsLength: number;
  isSelf: boolean;
  isLoggedIn: boolean;
  followBusy: boolean;
  followingListFetch: FollowingListFetch;
  isFollowing: boolean;
  userProfileReturnPath: string;
  msgHref: string;
  onFollowSubmit: () => void;
}) {
  const {
    t,
    id,
    profileAuthor,
    displayName,
    loading,
    userPostsLength,
    isSelf,
    isLoggedIn,
    followBusy,
    followingListFetch,
    isFollowing,
    userProfileReturnPath,
    msgHref,
    onFollowSubmit,
  } = props;

  return (
    <header className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-900/60 backdrop-blur-md px-4 py-6 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-ink-600 ring-2 ring-ref-sun/28">
            {profileAuthor?.avatar_url?.trim() ? (
              <Image
                src={communityMediaAbsoluteUrlForRender(profileAuthor.avatar_url.trim())}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
                unoptimized={communityMediaNextImageUnoptimized(
                  communityMediaAbsoluteUrlForRender(profileAuthor.avatar_url.trim())
                )}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-h4 font-medium text-ref-sun">
                {displayName.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-h4 font-bold text-slate-100 truncate">{displayName}</h1>
            {profileAuthor?.wallet ? (
              <p className="text-meta mt-0.5 font-mono text-ref-sun truncate max-w-full">{profileAuthor.wallet}</p>
            ) : null}
            <p className="text-meta mt-1 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 ${communityStoredRolePillClassName(
                  profileAuthor?.role ?? "tourist"
                )}`}
              >
                {t(communityStoredRoleLabelI18nKey(profileAuthor?.role))}
              </span>
              {!isSelf && !loading && userPostsLength === 0 ? (
                <span className="text-slate-400">{t("community_user_no_posts_hint")}</span>
              ) : null}
            </p>
            <p className="text-meta text-slate-400 mt-0.5 break-all">ID: {id}</p>
          </div>
        </div>
        {isSelf ? (
          <Link
            href="/community/me/posts"
            className={`${TT_COMMUNITY_PAGE_L5.primaryCtaFilled} ${communityCyanPillFocus}`}
          >
            {t("community_user_self_grid_posts")}
          </Link>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {isLoggedIn ? (
              <form
                className="inline"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault();
                  onFollowSubmit();
                }}
              >
                <button
                  type="submit"
                  disabled={followBusy || followingListFetch !== "ready"}
                  aria-busy={followBusy ? true : undefined}
                  className={`${TT_COMMUNITY_PAGE_L5.pill} disabled:opacity-60 disabled:cursor-not-allowed ${communityCyanPillFocus}`}
                >
                  {followingListFetch === "loading" || followingListFetch === "idle"
                    ? t("common_loading")
                    : followingListFetch === "error"
                      ? t("community_follow_status_unknown")
                      : isFollowing
                        ? t("community_unfollow")
                        : t("community_follow")}
                </button>
              </form>
            ) : (
              <Link
                href={`/auth/login?returnUrl=${encodeURIComponent(userProfileReturnPath)}`}
                className={`rounded-full border border-slate-500/60 bg-ink-800/80 px-4 py-2.5 text-meta font-medium text-slate-200 hover:border-ref-sun/35 hover:text-ref-coral motion-sub min-h-[44px] inline-flex items-center justify-center ${communitySlatePillFocus}`}
              >
                {t("community_login_to_follow")}
              </Link>
            )}
            <Link
              href={isLoggedIn ? msgHref : "/auth/login"}
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {isLoggedIn ? t("community_chat") : t("community_login_to_chat")}
            </Link>
            {profileAuthor?.role === "guide" || profileAuthor?.isEscrowGuide ? (
              <Link href={marketHrefForCommunityUser(id)} className={`${COMMUNITY_BOOK_GUIDE_CTA_CLASS} px-4 py-2.5`}>
                {t("community_book_guide_cta")}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
