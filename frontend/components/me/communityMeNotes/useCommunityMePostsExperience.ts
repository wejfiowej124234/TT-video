"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { deletePost, patchPostVisibility } from "@/lib/apiClient/community";
import type { CommunityPost, CommunityPostUserVisibility } from "@/lib/communityMockData";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { communityMeLoginReturnUrl } from "@/lib/communityMeContentNav";
import { clearCommunityBrowseHistory, readCommunityBrowseHistory } from "@/lib/communityBrowseHistory";
import type { CommunityBrowseHistoryEntry } from "@/lib/communityBrowseHistory";
import { dataStateSuccess, deriveListDataState, type DataState } from "@/lib/dataState";
import { useCommunityDeletePostConfirm } from "@/components/community/useCommunityDeletePostConfirm";
import type { LocaleInterpolationVars } from "@/lib/i18n";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";
import {
  filterCommunityMePostsExcludingId,
  mapCommunityMePostsWithVisibility,
} from "@/app/community/me/posts/communityMePostsPageLocalState";
import { shouldEvictPostFromVisFilter } from "@/lib/communityPostVisibilityEvict";
import { useCommunityMePostsPageMyPostsQuery } from "@/app/community/me/posts/useCommunityMePostsPageMyPostsQuery";
import { useCommunityMePageSessionPin } from "@/lib/communityMePageSessionPin";
import { useCommunityMeDrawerPostDetail } from "@/lib/useCommunityMeDrawerPostDetail";

export type CommunityMePostsExperienceProps = {
  /** @deprecated PostDetailDrawer 内联打开，不再跳转 `/community/post/:id` */
  onLeaveDrawer?: () => void;
};

export type CommunityMePostsExperienceViewModel = {
  t: (key: string, vars?: LocaleInterpolationVars) => string;
  isLoggedIn: boolean;
  authPending: boolean;
  meUser: ReturnType<typeof useCommunityAuth>["user"];
  loginReturnPath: string;
  deleteError: string | null;
  visibilityError: string | null;
  visibilityBusyId: string | null;
  postsVisFilter: CommunityMePostsVisFilterKey;
  setPostsVisFilter: (key: CommunityMePostsVisFilterKey) => void;
  postsListState: DataState<readonly CommunityPost[]>;
  onRetryList: () => void;
  postsListTruncated: boolean;
  postsHasMore: boolean;
  postsLoadMoreBusy: boolean;
  loadMorePosts: () => void;
  browseEntries: CommunityBrowseHistoryEntry[];
  onClearBrowseHistory: () => void;
  confirmDeletePost: (postId: string) => void;
  deleteBusyId: string | null;
  deleteConfirmPostId: string | null;
  deleteConfirmBusy: boolean;
  cancelDeletePost: () => void;
  confirmDeletePostAction: () => void;
  onPinToTop: (postId: string) => void;
  onVisibilityChange: (postId: string, next: CommunityPostUserVisibility) => void;
  postsForGrid: readonly CommunityPost[];
  openPost: (p: CommunityPost) => void;
  likedIds: Set<string>;
  collectedIds: Set<string>;
  handleLike: (id: string, hint?: { serverLiked?: boolean }) => void | Promise<void>;
  handleCollect: (id: string, hint?: { serverCollected?: boolean }) => void | Promise<void>;
  interactionToast: string | null;
  postDetail: ReturnType<typeof useCommunityMeDrawerPostDetail>;
  onLeaveDrawer?: () => void;
};

/** 31 附录 / 51-31-19：社区帖子抽屉 VM；完整页见 `/community/me/posts`。 */
export function useCommunityMePostsExperience({
  onLeaveDrawer,
}: CommunityMePostsExperienceProps): CommunityMePostsExperienceViewModel {
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loginReturnPath = useMemo(
    () => communityMeLoginReturnUrl(pathname, searchParams, "posts"),
    [pathname, searchParams],
  );
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsVisFilter, setPostsVisFilter] = useState<CommunityMePostsVisFilterKey>("all");

  const {
    apiPosts,
    setApiPosts,
    loading,
    postsLoadError,
    postsListTruncated,
    postsHasMore,
    postsLoadMoreBusy,
    loadMorePosts,
  } = useCommunityMePostsPageMyPostsQuery({
    postsRetryKey,
    postsVisFilter,
    t,
    isLoggedIn,
    authPending,
  });

  const postDetail = useCommunityMeDrawerPostDetail({
    logContext: "CommunityMePosts",
    loginReturnPath,
    isLoggedIn,
    authPending,
    meUser,
    t,
    setApiPosts,
  });

  const { handleLike, handleCollect, likedIds, collectedIds, interactionToast } = useCommunityPostLikeCollect(t, {
    postsForLikeSync: apiPosts,
    detailPostForLikeSync: postDetail.detailPost,
  });

  const { itemsForGrid: postsForGrid, pinToTop, removeFromPin, resetPin } = useCommunityMePageSessionPin(
    apiPosts,
    (p) => p.id,
  );

  useEffect(() => {
    if (!isLoggedIn && !authPending) {
      resetPin();
    }
  }, [isLoggedIn, authPending, resetPin]);

  const postsListState = useMemo(() => {
    const base = deriveListDataState({ loading, error: postsLoadError, items: postsForGrid });
    if (base.kind === "empty") return dataStateSuccess(postsForGrid);
    return base;
  }, [loading, postsLoadError, postsForGrid]);

  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [browseTick, setBrowseTick] = useState(0);

  const browseEntries = useMemo(() => {
    void browseTick;
    return readCommunityBrowseHistory();
  }, [browseTick]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const bump = () => setBrowseTick((x) => x + 1);
    window.addEventListener("focus", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const { setDetailPost } = postDetail;

  const performDeletePost = useCallback(
    async (postId: string) => {
      setDeleteError(null);
      setDeleteBusyId(postId);
      try {
        const delRes = await deletePost(postId);
        if (delRes?.status !== "ok") {
          setDeleteError(messageForCommunityActionResponse(delRes, t, "community_delete_post_failed"));
          return;
        }
        setDeleteError(null);
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        removeFromPin(postId);
        setDetailPost((d) => (d?.id === postId ? null : d));
      } catch (err) {
        if (typeof window !== "undefined") {
          console.error("CommunityMePostsExperience deletePost:", err);
        }
        setDeleteError(mapApiReadError(err, t, "community_delete_post_failed"));
      } finally {
        setDeleteBusyId(null);
      }
    },
    [t, removeFromPin, setApiPosts, setDetailPost],
  );

  const {
    deleteConfirmPostId,
    deleteConfirmBusy,
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost: confirmDeletePostAction,
  } = useCommunityDeletePostConfirm(performDeletePost);

  const confirmDeletePost = useCallback(
    (postId: string) => {
      requestDeletePost(postId);
    },
    [requestDeletePost],
  );

  const onClearBrowseHistory = useCallback(() => {
    clearCommunityBrowseHistory();
    setBrowseTick((x) => x + 1);
  }, []);

  const openPost = useCallback(
    (p: CommunityPost) => {
      postDetail.openPostDetail(p, null, false);
    },
    [postDetail],
  );

  const onRetryList = useCallback(() => setPostsRetryKey((k) => k + 1), []);

  const onVisibilityChange = useCallback(
    (postId: string, next: CommunityPostUserVisibility) => {
      setVisibilityError(null);
      const existing = apiPosts.find((p) => p.id === postId);
      const prevVis = (existing?.visibilityStatus ?? "public") as CommunityPostUserVisibility;
      if (prevVis === next) return;

      const evict = shouldEvictPostFromVisFilter(postsVisFilter, next);
      setApiPosts((prev) => {
        if (evict) return filterCommunityMePostsExcludingId(prev, postId);
        return mapCommunityMePostsWithVisibility(prev, postId, next);
      });
      if (evict) {
        removeFromPin(postId);
        setDetailPost((d) => (d?.id === postId ? null : d));
      }

      setVisibilityBusyId(postId);
      void patchPostVisibility(postId, next)
        .catch((err) => {
          if (typeof window !== "undefined") {
            console.error("CommunityMePostsExperience patchPostVisibility:", err);
          }
          if (evict) {
            setPostsRetryKey((k) => k + 1);
          } else {
            setApiPosts((prev) => mapCommunityMePostsWithVisibility(prev, postId, prevVis));
          }
          setVisibilityError(mapApiReadError(err, t, "community_post_visibility_change_failed"));
        })
        .finally(() => {
          setVisibilityBusyId(null);
        });
    },
    [apiPosts, postsVisFilter, removeFromPin, setApiPosts, t, setDetailPost],
  );

  return {
    t,
    isLoggedIn,
    authPending,
    meUser,
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
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    onPinToTop: pinToTop,
    onVisibilityChange,
    postsForGrid,
    openPost,
    likedIds,
    collectedIds,
    handleLike,
    handleCollect,
    interactionToast,
    postDetail,
    onLeaveDrawer,
  };
}
