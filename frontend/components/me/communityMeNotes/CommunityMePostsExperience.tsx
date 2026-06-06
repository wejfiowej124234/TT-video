"use client";

import { CommunityDeletePostConfirmDialog } from "@/components/community/CommunityDeletePostConfirmDialog";
import { CommunityMePostsExperienceMain } from "@/components/me/communityMeNotes/CommunityMePostsExperienceMain";
import { CommunityMePostsExperiencePortals } from "@/components/me/communityMeNotes/CommunityMePostsExperiencePortals";
import {
  useCommunityMePostsExperience,
  type CommunityMePostsExperienceProps,
} from "@/components/me/communityMeNotes/useCommunityMePostsExperience";

/**
 * 31 附录 / 51-31-19：社区帖子 Hub 玻璃抽屉（VM + Main + L5 删除确认 + PostDetailDrawer）。
 * 完整列表见 `/community/me/posts`（抽屉内「在完整页面打开」同路径）。
 */
export function CommunityMePostsExperience(props: CommunityMePostsExperienceProps) {
  const vm = useCommunityMePostsExperience(props);
  const {
    t,
    isLoggedIn,
    authPending,
    meUser,
    deleteConfirmPostId,
    deleteConfirmBusy,
    deleteBusyId,
    cancelDeletePost,
    confirmDeletePostAction,
    postsForGrid,
    likedIds,
    collectedIds,
    handleLike,
    handleCollect,
    interactionToast,
    confirmDeletePost,
    visibilityBusyId,
    onVisibilityChange,
    postDetail,
  } = vm;

  return (
    <>
      <CommunityMePostsExperienceMain {...vm} />
      <CommunityMePostsExperiencePortals
        t={t}
        isLoggedIn={isLoggedIn}
        authPending={authPending}
        meUser={meUser}
        postsForVideoNav={postsForGrid}
        likedIds={likedIds}
        collectedIds={collectedIds}
        handleLike={handleLike}
        handleCollect={handleCollect}
        interactionToast={interactionToast}
        confirmDeletePost={confirmDeletePost}
        deleteBusyId={deleteBusyId}
        visibilityBusyId={visibilityBusyId}
        onPostVisibilityChange={onVisibilityChange}
        postDetail={postDetail}
      />
      <CommunityDeletePostConfirmDialog
        open={deleteConfirmPostId != null}
        busy={deleteConfirmBusy || deleteBusyId === deleteConfirmPostId}
        t={t}
        surface="hub"
        onCancel={cancelDeletePost}
        onConfirm={confirmDeletePostAction}
      />
    </>
  );
}

export type { CommunityMePostsExperienceProps };
