"use client";

import Link from "next/link";
import ApiErrorAlert from "@/components/ApiErrorAlert";
import { communityCyanPillFocus } from "@/lib/communityA11yFocus";
import { CommunityMePostsShowcaseThumbGrid } from "@/components/me/communityMeNotes/CommunityMePostsShowcaseThumbGrid";
import CommunityMeDataStateSurface from "@/components/me/CommunityMeDataStateSurface";
import { CommunityMeDrawerGridLoadingSkeleton } from "@/components/me/communityMeNotes/CommunityMeDrawerGridLoadingSkeleton";
import { CommunityMePostsShowcaseDrawerEmptyPanel } from "@/components/me/communityMeNotes/CommunityMePostsShowcaseDrawerEmptyPanel";
import { CommunityMePostsDrawerFilteredEmptyPanel } from "@/components/me/communityMeNotes/CommunityMePostsDrawerFilteredEmptyPanel";
import { CommunityMePostsVisFilterGroup } from "@/components/me/communityMeNotes/CommunityMePostsVisFilterGroup";
import { CommunityMeSessionPinNote } from "@/components/me/communityMeNotes/CommunityMeSessionPinNote";
import { CommunityMeListLoadMoreButton } from "@/components/me/communityMeNotes/CommunityMeListLoadMoreButton";
import type { CommunityMePostsExperienceViewModel } from "@/components/me/communityMeNotes/useCommunityMePostsExperience";

export function CommunityMePostsExperienceMain(vm: CommunityMePostsExperienceViewModel) {
  const {
    t,
    isLoggedIn,
    authPending,
    loginReturnPath,
    deleteError,
    visibilityError,
    visibilityBusyId,
    postsVisFilter,
    setPostsVisFilter,
    postsListState,
    onRetryList,
    postsListTruncated,
    postsHasMore,
    postsLoadMoreBusy,
    loadMorePosts,
    browseEntries,
    onClearBrowseHistory,
    confirmDeletePost,
    deleteBusyId,
    onPinToTop,
    onVisibilityChange,
    postsForGrid,
    openPost,
    onLeaveDrawer,
  } = vm;

  const drawerRootClass = "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden";

  if (!isLoggedIn && !authPending) {
    return (
      <div className={drawerRootClass} role="region" aria-label={t("community_me_tab_community_posts")}>
        <section
          data-tt-community-me-surface="community_me_posts_auth_gate"
          data-tt-data-state="invalid"
          className="rounded-[var(--radius-md)] border border-cyan-500/35 bg-ink-800/70 backdrop-blur-md px-6 py-10 text-center space-y-4"
          role="region"
        >
          <p className="text-body text-slate-200">{t("community_me_posts_login_required")}</p>
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
    <div className={drawerRootClass} role="region" aria-label={t("community_me_tab_community_posts")}>
      {deleteError ? (
        <div className="mb-4">
          <ApiErrorAlert message={deleteError} />
        </div>
      ) : null}
      {visibilityError ? (
        <div className="mb-4">
          <ApiErrorAlert message={visibilityError} />
        </div>
      ) : null}

      <div className="space-y-4 pb-2">
        <CommunityMePostsVisFilterGroup
          t={t}
          postsVisFilter={postsVisFilter}
          onSelect={setPostsVisFilter}
          variant="hub"
        />
        {browseEntries.length > 0 ? (
          <section
            className="rounded-[var(--radius-md)] border border-slate-600/45 bg-ink-800/50 px-3 py-3"
            aria-label={t("community_me_browse_history_panel_title")}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-meta font-semibold text-slate-200">{t("community_me_browse_history_panel_title")}</h3>
              <button
                type="button"
                onClick={onClearBrowseHistory}
                className={`rounded-full border border-slate-500/60 bg-ink-800/80 px-2.5 py-1 text-[0.7rem] font-medium text-slate-300 hover:bg-ink-700/80 motion-sub min-h-[36px] ${communityCyanPillFocus}`}
              >
                {t("community_me_browse_history_clear")}
              </button>
            </div>
            <p className="text-[0.65rem] text-slate-500 mb-2 leading-snug">{t("community_me_browse_history_desc")}</p>
            <ul className="m-0 flex list-none gap-2 overflow-x-auto overflow-y-hidden p-0 pb-1 [-webkit-overflow-scrolling:touch]">
              {browseEntries.map((e) => {
                const label =
                  (e.title && e.title.trim()) ||
                  (e.preview && e.preview.trim().slice(0, 48)) ||
                  `#${e.id.slice(0, 8)}`;
                return (
                  <li key={e.id} className="shrink-0 max-w-[11rem]">
                    <Link
                      href={`/community?post=${encodeURIComponent(e.id)}`}
                      prefetch={false}
                      onClick={() => onLeaveDrawer?.()}
                      className={`block truncate rounded-[var(--radius-md)] border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-2 text-[0.7rem] font-medium text-cyan-100 hover:bg-cyan-500/20 motion-sub min-h-[44px] ${communityCyanPillFocus}`}
                      title={label}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
        {postsListTruncated && !postsHasMore ? (
          <p
            className="rounded-[var(--radius-md)] border border-warning/35 bg-warning/25 px-3 py-2 text-meta text-white/95 leading-snug"
            role="status"
          >
            {t("community_me_posts_page_truncated_hint", { maxPosts: "100" })}
          </p>
        ) : null}
        <CommunityMeSessionPinNote
          t={t}
          visible={postsListState.kind === "success" && postsForGrid.length >= 2}
          surface="drawer"
        />
        <CommunityMeDataStateSurface
          state={postsListState}
          t={t}
          analyticsSurface="community_me_posts_list"
          onRetry={onRetryList}
          loadingSlot={<CommunityMeDrawerGridLoadingSkeleton ariaLabel={t("community_me_tab_community_posts")} />}
          emptySlot={null}
          success={(items) => {
            const drawerEmpty = items.length === 0;
            const filteredEmpty = drawerEmpty && postsVisFilter !== "all";
            return (
              <div
                className={
                  drawerEmpty && !filteredEmpty
                    ? "space-y-4 rounded-[var(--radius-md)] border border-dashed border-cyan-500/35 bg-ink-800/45 px-4 py-5 sm:px-5"
                    : filteredEmpty
                      ? "space-y-4"
                      : "contents"
                }
              >
                {filteredEmpty ? (
                  <CommunityMePostsDrawerFilteredEmptyPanel
                    t={t}
                    postsVisFilter={postsVisFilter}
                    onClearFilter={() => setPostsVisFilter("all")}
                  />
                ) : (
                  <>
                    <CommunityMePostsShowcaseThumbGrid
                      posts={items}
                      t={t}
                      onOpenPost={openPost}
                      onRequestDelete={(postId) => confirmDeletePost(postId)}
                      onPinToTop={onPinToTop}
                      onVisibilityChange={onVisibilityChange}
                      deleteBusyId={deleteBusyId}
                      visibilityBusyId={visibilityBusyId}
                      listAriaLabel={t("community_me_tab_community_posts")}
                      minSlots={3}
                      allowDelete
                    />
                    {drawerEmpty ? <CommunityMePostsShowcaseDrawerEmptyPanel t={t} /> : null}
                  </>
                )}
              </div>
            );
          }}
        />
        {postsHasMore ? (
          <CommunityMeListLoadMoreButton
            t={t}
            busy={postsLoadMoreBusy}
            onClick={loadMorePosts}
            surface="drawer"
          />
        ) : null}
      </div>
    </div>
  );
}
