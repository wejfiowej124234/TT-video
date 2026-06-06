"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { CommunityMeNotesPostThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";
import { MeLikesEmptyPanel } from "./MeLikesEmptyPanel";
import type { CommunityMeLikesPageViewModel } from "./useCommunityMeLikesPage";
import { TT_COMMUNITY_PAGE_L5 } from "@/lib/marketingUi";

export function CommunityMeLikesPageMain({ vm }: { vm: CommunityMeLikesPageViewModel }) {
  const {
    t,
    loading,
    likedPosts,
    likedPostsForGrid,
    pinLikeToTop,
    listLoadError,
    partialHint,
    setLikesRetryKey,
    onViewFull,
    requestUnlike,
    likesListTruncated,
    likesHasMore,
    likesLoadMoreBusy,
    loadMoreLikes,
  } = vm;

  return (
    <main
      className="max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-24 safe-area-pb"
      aria-label={t("community_me_likes_title")}
      data-tt-community-me-likes-page="1"
    >
      <header className="rounded-[var(--radius-md)] border border-ref-sun/28 bg-ink-900/60 backdrop-blur-md px-4 py-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-h4 font-bold text-ref-sun/90">{t("community_me_likes_title")}</h1>
          <Link
            href="/me/settings/profile"
            className={`${TT_COMMUNITY_PAGE_L5.pillCompact} ${communityCyanPillFocus}`}
          >
            {t("me_title")}
          </Link>
        </div>
      </header>

      {listLoadError && (
        <div className="mb-4 space-y-2">
          <ApiErrorAlert message={listLoadError} />
          <form
            className="inline"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              setLikesRetryKey((k) => k + 1);
            }}
          >
            <button
              type="submit"
              aria-label={t("common_retry")}
              className={`${TT_COMMUNITY_PAGE_L5.pill} ${communityCyanPillFocus}`}
            >
              {t("common_retry")}
            </button>
          </form>
        </div>
      )}

      {partialHint ? (
        <p
          className="mb-4 rounded-[var(--radius-md)] border border-warning/35 bg-warning/20 px-3 py-2 text-meta text-slate-200"
          role="status"
        >
          {partialHint}
        </p>
      ) : null}

      {likesListTruncated && !likesHasMore ? (
        <p
          className="mb-4 rounded-[var(--radius-md)] border border-warning/35 bg-warning/20 px-3 py-2 text-meta text-slate-200"
          role="status"
        >
          {t("community_me_likes_list_cap_hint", { max: String(COMMUNITY_ME_DRAWER_LIST_ID_CAP) })}
        </p>
      ) : null}

      <CommunityMeSessionPinNote t={t} visible={!loading && likedPosts.length >= 2} surface="page" />

      <div className="space-y-4">
        {loading ? (
          <section className="rounded-[var(--radius-md)] border border-ref-sun/25 bg-ink-900/70 px-6 py-12 text-center">
            <p className="text-body text-slate-300" role="status" aria-label={t("common_loading")}>
              {t("common_loading")}
            </p>
          </section>
        ) : likedPosts.length === 0 && !listLoadError ? (
          <MeLikesEmptyPanel t={t} />
        ) : !loading && likedPosts.length > 0 ? (
          <CommunityMeNotesPostThumbGrid
            posts={likedPostsForGrid}
            t={t}
            onOpenPost={onViewFull}
            listAriaLabel={t("community_me_likes_title")}
            cardMenu={{
              onDelete: (postId) => {
                requestUnlike(postId);
              },
              onPinToTop: pinLikeToTop,
              deleteLabelKey: "community_me_notes_menu_remove_like",
              deletePendingLabelKey: "community_me_notes_menu_remove_like_pending",
            }}
          />
        ) : null}
        {likesHasMore ? (
          <CommunityMeListLoadMoreButton
            t={t}
            busy={likesLoadMoreBusy}
            onClick={loadMoreLikes}
            surface="page"
          />
        ) : null}
      </div>
    </main>
  );
}
