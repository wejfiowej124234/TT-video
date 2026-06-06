"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { usePathname, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { isCommunityMeLikesListEnabled } from "@/lib/communityMeFeatureFlags";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useMemo } from "react";
import { CommunityMeLikesPortals } from "@/app/community/me/likes/CommunityMeLikesPortals";
import { useCommunityMeLikesPage } from "@/app/community/me/likes/useCommunityMeLikesPage";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";
import { CommunityMeNotesPostThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import { MeLikesEmptyPanel } from "@/app/community/me/likes/MeLikesEmptyPanel";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { dataStateInvalid, dataStateSuccess, deriveListDataState } from "@/lib/dataState";

const drawerShellClass = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

export type CommunityMeLikesExperienceProps = {
  /** @deprecated PostDetailDrawer 内联打开，不再跳转 `/community/post/:id` */
  onLeaveDrawer?: () => void;
};

/** 赞过 Hub 玻璃抽屉：与 `/community/me/likes` 共用 VM + PostDetailDrawer。 */
export function CommunityMeLikesExperience(_props: CommunityMeLikesExperienceProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "likes"),
    [pathname, searchParams],
  );
  const likesFeatureOn = isCommunityMeLikesListEnabled();
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const vm = useCommunityMeLikesPage();

  const {
    loading,
    likedPostsForGrid,
    pinLikeToTop,
    listLoadError,
    partialHint,
    likesListTruncated,
    likesHasMore,
    likesLoadMoreBusy,
    loadMoreLikes,
    setLikesRetryKey,
    onViewFull,
    requestUnlike,
  } = vm;

  const likesListState = useMemo(() => {
    if (!likesFeatureOn) {
      return dataStateInvalid(t("community_me_likes_feature_disabled_hint"));
    }
    const base = deriveListDataState({ loading, error: listLoadError, items: likedPostsForGrid });
    if (!loading && !listLoadError && likedPostsForGrid.length === 0) {
      return dataStateSuccess(likedPostsForGrid);
    }
    return base;
  }, [likesFeatureOn, loading, listLoadError, likedPostsForGrid, t]);

  if (!likesFeatureOn) {
    return (
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <CommunityMeDataStateSurface
          state={dataStateInvalid(t("community_me_likes_feature_disabled_hint"))}
          t={t}
          analyticsSurface="community_me_likes_list"
          emptySlot={<></>}
          invalidSlot={
            <section
              className="rounded-[var(--radius-md)] border border-dashed border-warning/35 bg-ink-800/50 px-5 py-8 text-center space-y-4"
              role="region"
              aria-label={t("community_me_likes_feature_disabled_title")}
            >
              <p className="text-body text-slate-200">{t("community_me_likes_feature_disabled_body")}</p>
              <Link
                href="/me/settings/profile"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-4 py-2 text-meta font-medium text-cyan-200 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
              >
                {t("me_title")}
              </Link>
            </section>
          }
          success={() => null}
        />
      </div>
    );
  }

  if (!isLoggedIn && !authPending) {
    return (
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <section
          data-tt-community-me-surface="community_me_likes_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_likes_login_required")}</p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(loginReturnPath)}`}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-500/20 px-5 py-2.5 text-meta font-medium text-cyan-300 hover:text-cyan-100 hover:bg-cyan-500/30 motion-sub ${communityCyanPillFocus}`}
          >
            {t("community_activity_go_login")}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className={drawerShellClass} role="region" aria-label={t("community_me_likes_title")}>
        <div className="space-y-4 pb-2">
          {partialHint ? (
            <p
              className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/25 px-3 py-2 text-meta text-white/95"
              role="status"
            >
              {partialHint}
            </p>
          ) : null}
          <CommunityMeSessionPinNote
            t={t}
            visible={likesListState.kind === "success" && likedPostsForGrid.length >= 2}
            surface="drawer"
          />
          <CommunityMeDataStateSurface
            state={likesListState}
            t={t}
            analyticsSurface="community_me_likes_list"
            onRetry={() => setLikesRetryKey((k) => k + 1)}
            loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_likes_title")} />}
            emptySlot={<></>}
            success={(items) => (
              <div
                className={
                  items.length === 0
                    ? "space-y-4 rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-4 py-5 sm:px-5"
                    : "space-y-2"
                }
              >
                <CommunityMeNotesPostThumbGrid
                  posts={items}
                  t={t}
                  listAriaLabel={t("community_me_likes_title")}
                  minEmptySlots={items.length === 0 ? 3 : 0}
                  onOpenPost={onViewFull}
                  cardMenu={{
                    onDelete: (postId) => {
                      requestUnlike(postId);
                    },
                    onPinToTop: pinLikeToTop,
                    deleteLabelKey: "community_me_notes_menu_remove_like",
                    deletePendingLabelKey: "community_me_notes_menu_remove_like_pending",
                  }}
                />
                {items.length === 0 ? <MeLikesEmptyPanel t={t} /> : null}
              </div>
            )}
          />
          {likesHasMore ? (
            <CommunityMeListLoadMoreButton t={t} busy={likesLoadMoreBusy} onClick={loadMoreLikes} surface="drawer" />
          ) : null}
          {likesListState.kind === "success" && likesListTruncated && !likesHasMore ? (
            <p className="px-1 pt-1 text-[0.7rem] leading-snug text-white/75 sm:text-meta">
              {t("community_me_likes_list_cap_hint", { max: String(COMMUNITY_ME_DRAWER_LIST_ID_CAP) })}
            </p>
          ) : null}
        </div>
      </div>
      <CommunityMeLikesPortals vm={vm} confirmSurface="hub" />
    </>
  );
}
