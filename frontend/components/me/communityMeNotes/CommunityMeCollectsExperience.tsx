"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { communityCyanPillFocus, communityFuchsiaPillFocus } from "@/lib/communityA11yFocus";
import { usePathname, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useMemo } from "react";
import { CommunityMeCollectsPortals } from "@/app/community/me/collects/CommunityMeCollectsPortals";
import { useCommunityMeCollectsPage } from "@/app/community/me/collects/useCommunityMeCollectsPage";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";
import { CommunityMeNotesPostThumbGrid } from "@/components/me/communityMeNotes/CommunityMeNotesPostThumbGrid";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import { MeCollectsEmptyPanel } from "@/app/community/me/collects/MeCollectsEmptyPanel";
import { COMMUNITY_ME_DRAWER_LIST_ID_CAP } from "@/lib/communityMeDrawerListCaps";
import { dataStateSuccess, deriveListDataState } from "@/lib/dataState";

export type CommunityMeCollectsExperienceProps = {
  /** @deprecated PostDetailDrawer 内联打开，不再跳转 `/community/post/:id` */
  onLeaveDrawer?: () => void;
};

/** 我的收藏 Hub 玻璃抽屉：与 `/community/me/collects` 共用 VM + PostDetailDrawer。 */
export function CommunityMeCollectsExperience(_props: CommunityMeCollectsExperienceProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "collects"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending } = useCommunityAuth();
  const vm = useCommunityMeCollectsPage();

  const {
    loading,
    collectedPostsForGrid,
    pinCollectToTop,
    listLoadError,
    partialHint,
    collectsListTruncated,
    collectsHasMore,
    collectsLoadMoreBusy,
    loadMoreCollects,
    setCollectsRetryKey,
    onViewFull,
    requestUncollect,
  } = vm;

  const collectsListState = useMemo(() => {
    const base = deriveListDataState({ loading, error: listLoadError, items: collectedPostsForGrid });
    if (!loading && !listLoadError && collectedPostsForGrid.length === 0) {
      return dataStateSuccess(collectedPostsForGrid);
    }
    return base;
  }, [loading, listLoadError, collectedPostsForGrid]);

  if (!isLoggedIn && !authPending) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" role="region" aria-label={t("community_me_my_collects")}>
        <section
          data-tt-community-me-surface="community_me_collects_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_collects_login_required")}</p>
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" role="region" aria-label={t("community_me_my_collects")}>
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
            visible={collectsListState.kind === "success" && collectedPostsForGrid.length >= 2}
            surface="drawer"
          />
          <CommunityMeDataStateSurface
            state={collectsListState}
            t={t}
            analyticsSurface="community_me_collects_list"
            onRetry={() => setCollectsRetryKey((k) => k + 1)}
            loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_my_collects")} />}
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
                  listAriaLabel={t("community_me_my_collects")}
                  minEmptySlots={items.length === 0 ? 3 : 0}
                  onOpenPost={onViewFull}
                  cardMenu={{
                    onDelete: (postId) => {
                      requestUncollect(postId);
                    },
                    onPinToTop: pinCollectToTop,
                    deleteLabelKey: "community_me_notes_menu_remove_collect",
                    deletePendingLabelKey: "community_me_notes_menu_remove_collect_pending",
                  }}
                />
                {items.length === 0 ? <MeCollectsEmptyPanel t={t} /> : null}
              </div>
            )}
          />
          {collectsHasMore ? (
            <CommunityMeListLoadMoreButton t={t} busy={collectsLoadMoreBusy} onClick={loadMoreCollects} surface="drawer" />
          ) : null}
          {collectsListState.kind === "success" && collectsListTruncated && !collectsHasMore ? (
            <p className="px-1 pt-1 text-[0.7rem] leading-snug text-white/75 sm:text-meta">
              {t("community_me_collects_list_cap_hint", { max: String(COMMUNITY_ME_DRAWER_LIST_ID_CAP) })}
            </p>
          ) : null}
        </div>
      </div>
      <CommunityMeCollectsPortals vm={vm} confirmSurface="hub" />
    </>
  );
}
