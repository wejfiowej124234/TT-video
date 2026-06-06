"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { deletePost, patchPostVisibility, type CommunityCommentSort } from "@/lib/apiClient/community";
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import type {
  CommunityPost,
  CommunityComment,
  CommunityPostUserVisibility,
  CommunityPostVisibility,
} from "@/lib/communityMockData";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { mapApiReadError } from "@/lib/mapApiReadError";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import { communityOpenPostDetail } from "@/components/community/communityOpenPostDetail";
import { useState, useCallback, useRef, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import type { CommunityMePostsVisFilterKey } from "@/lib/communityMePostsVisFilters";
import { parseCommunityMePostsVisQuery } from "@/lib/communityMePostsVisFilters";
import { useCommunityMePostsPageCommentSend } from "./useCommunityMePostsPageCommentSend";
import {
  clearCommunityMePostRefIfId,
  filterCommunityMePostsExcludingId,
  mapCommunityMePostRefWithVisibility,
  mapCommunityMePostsWithVisibility,
  omitCommunityMeCommentsByPostId,
} from "./communityMePostsPageLocalState";
import { useCommunityMePostsPageMyPostsQuery } from "./useCommunityMePostsPageMyPostsQuery";
import { useCommunityDeletePostConfirm } from "@/components/community/useCommunityDeletePostConfirm";
import { messageForCommunityActionResponse } from "@/lib/formatCommunityApiMessage";
import { useCommunityMePageSessionPin } from "@/lib/communityMePageSessionPin";
import { shouldEvictPostFromVisFilter } from "@/lib/communityPostVisibilityEvict";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityMePostsPageViewModel = {
  t: LocaleTranslateFn;
  isLoggedIn: boolean;
  authPending: boolean;
  meUser: ReturnType<typeof useCommunityAuth>["user"];
  loading: boolean;
  myPosts: CommunityPost[];
  postsLoadError: string | null;
  postsListTruncated: boolean;
  postsHasMore: boolean;
  postsLoadMoreBusy: boolean;
  loadMorePosts: () => void;
  setPostsRetryKey: Dispatch<SetStateAction<number>>;
  postsVisFilter: CommunityMePostsVisFilterKey;
  setPostsVisFilter: (next: CommunityMePostsVisFilterKey) => void;
  deleteError: string | null;
  visibilityError: string | null;
  deleteBusyId: string | null;
  visibilityBusyId: string | null;
  commentPost: CommunityPost | null;
  detailPost: CommunityPost | null;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  reportContext: ReturnType<typeof useCommunityPostReport>["reportContext"];
  handleReport: ReturnType<typeof useCommunityPostReport>["handleReport"];
  handleReportComment: ReturnType<typeof useCommunityPostReport>["handleReportComment"];
  closeReportDrawer: ReturnType<typeof useCommunityPostReport>["closeReportDrawer"];
  handleReportSubmit: ReturnType<typeof useCommunityPostReport>["handleReportSubmit"];
  reportSendFailed: boolean;
  reportErrorMessage: string | null;
  reportFieldMessages: Record<string, string> | null;
  clearReportSendError: () => void;
  reportNoticeBanner: string | null;
  reportSuccessFollowUp: { reportId: string } | null;
  commentsForPost: CommunityComment[];
  commentsForDetail: CommunityComment[];
  apiCommentsByPostId: Record<string, CommunityComment[]>;
  handleCommentSend: (content: string, parentId?: string) => Promise<void>;
  commentSendFailed: boolean;
  commentSendErrorMessage: string | null;
  commentFieldMessages: Record<string, string> | null;
  clearCommentSendError: () => void;
  commentsLoadError: string | null;
  setCommentsRetryTick: Dispatch<SetStateAction<number>>;
  commentSort: CommunityCommentSort;
  setCommentSort: Dispatch<SetStateAction<CommunityCommentSort>>;
  commentsHasMore: boolean;
  loadMoreComments: () => void;
  commentsLoadMoreBusy: boolean;
  handleLike: (id: string, hint?: { serverLiked?: boolean }) => void | Promise<void>;
  handleCollect: (id: string, hint?: { serverCollected?: boolean }) => void | Promise<void>;
  likedIds: Set<string>;
  collectedIds: Set<string>;
  mePostsInteractionToast: string | null;
  closeWithFocusReturn: (clear: () => void) => void;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  confirmDeletePost: (postId: string, trigger?: HTMLElement | null) => void;
  deleteConfirmPostId: string | null;
  deleteConfirmBusy: boolean;
  cancelDeletePost: () => void;
  confirmDeletePostAction: () => void;
  handlePostVisibilityChange: (postId: string, next: CommunityPostUserVisibility) => Promise<void>;
  handleGridVisibilityChange: (postId: string, next: CommunityPostUserVisibility) => void;
  openPostDetail: (post: CommunityPost, trigger?: HTMLElement | null) => void;
  pinPostToTop: (postId: string) => void;
  detailFocusComments: boolean;
  setDetailFocusComments: Dispatch<SetStateAction<boolean>>;
};

export function useCommunityMePostsPage(): CommunityMePostsPageViewModel {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [postsRetryKey, setPostsRetryKey] = useState(0);
  const [postsVisFilter, setPostsVisFilterState] = useState<CommunityMePostsVisFilterKey>(() =>
    parseCommunityMePostsVisQuery(searchParams.get("vis")),
  );
  const setPostsVisFilter = useCallback(
    (next: CommunityMePostsVisFilterKey) => {
      setPostsVisFilterState(next);
      if (pathname !== "/community/me/posts") return;
      const sp = new URLSearchParams(searchParams?.toString() ?? "");
      if (next === "all") sp.delete("vis");
      else sp.set("vis", next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const parsed = parseCommunityMePostsVisQuery(searchParams.get("vis"));
    setPostsVisFilterState((prev) => (prev === parsed ? prev : parsed));
  }, [searchParams]);

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
  const [visibilityBusyId, setVisibilityBusyId] = useState<string | null>(null);
  const [visibilityError, setVisibilityError] = useState<string | null>(null);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

  const { itemsForGrid: myPosts, pinToTop: pinPostToTop, removeFromPin } = useCommunityMePageSessionPin(
    apiPosts,
    (p) => p.id,
  );

  const {
    handleLike,
    handleCollect,
    likedIds,
    collectedIds,
    interactionToast: mePostsInteractionToast,
  } = useCommunityPostLikeCollect(t, {
    postsForLikeSync: myPosts,
    detailPostForLikeSync: detailPost,
  });

  const {
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportNoticeBanner,
    reportSuccessFollowUp,
  } = useCommunityPostReport(isLoggedIn, () => router.push("/auth/login?returnUrl=/community/me/posts"), t);

  const postIdOpen = commentPost?.id ?? detailPost?.id;
  const {
    apiCommentsByPostId,
    setApiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
  } = useCommunityDrawerCommentsQuery({
    postIdOpen,
    commentSort,
    commentsRetryTick,
    t,
    logContext: "CommunityMePosts",
  });

  const {
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
  } = useCommunityMePostsPageCommentSend(
    postIdOpen,
    commentPost,
    detailPost,
    meUser,
    t,
    setApiCommentsByPostId,
    setApiPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick
  );

  const commentsForPost = useMemo(() => {
    if (!commentPost) return [];
    return apiCommentsByPostId[commentPost.id] ?? [];
  }, [commentPost, apiCommentsByPostId]);

  const commentsForDetail = useMemo(() => {
    if (!detailPost) return [];
    return apiCommentsByPostId[detailPost.id] ?? [];
  }, [detailPost, apiCommentsByPostId]);

  const closeWithFocusReturn = useCallback((clear: () => void) => {
    const prev = focusReturnTargetRef.current;
    focusReturnTargetRef.current = null;
    clear();
    requestAnimationFrame(() => prev?.focus());
  }, []);

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
        setApiPosts((prev) => filterCommunityMePostsExcludingId(prev, postId));
        removeFromPin(postId);
        setDetailPost((d) => clearCommunityMePostRefIfId(d, postId));
        setCommentPost((c) => clearCommunityMePostRefIfId(c, postId));
        setApiCommentsByPostId((prev) => omitCommunityMeCommentsByPostId(prev, postId));
      } catch (e) {
        setDeleteError(mapApiReadError(e, t, "community_delete_post_failed"));
      } finally {
        setDeleteBusyId(null);
      }
    },
    [t, setApiPosts, setDetailPost, setCommentPost, setApiCommentsByPostId, removeFromPin]
  );

  const {
    deleteConfirmPostId,
    deleteConfirmBusy,
    requestDeletePost,
    cancelDeletePost,
    confirmDeletePost: confirmDeletePostAction,
  } = useCommunityDeletePostConfirm(performDeletePost);

  const confirmDeletePost = useCallback(
    (postId: string, trigger?: HTMLElement | null) => {
      requestDeletePost(postId, trigger);
    },
    [requestDeletePost],
  );

  const applyVisibilityLocal = useCallback((postId: string, next: CommunityPostUserVisibility) => {
    setApiPosts((prev) => mapCommunityMePostsWithVisibility(prev, postId, next));
    setDetailPost((d) => mapCommunityMePostRefWithVisibility(d, postId, next));
    setCommentPost((c) => mapCommunityMePostRefWithVisibility(c, postId, next));
  }, [setApiPosts, setCommentPost, setDetailPost]);

  const handlePostVisibilityChange = useCallback(
    async (postId: string, next: CommunityPostUserVisibility) => {
      setVisibilityError(null);
      const existing = apiPosts.find((p) => p.id === postId);
      const prevVis = (existing?.visibilityStatus ?? "public") as CommunityPostUserVisibility;
      if (prevVis === next) return;

      const evict = shouldEvictPostFromVisFilter(postsVisFilter, next);
      applyVisibilityLocal(postId, next);
      if (evict) {
        setApiPosts((prev) => filterCommunityMePostsExcludingId(prev, postId));
        removeFromPin(postId);
        setDetailPost((d) => clearCommunityMePostRefIfId(d, postId));
        setCommentPost((c) => clearCommunityMePostRefIfId(c, postId));
      }

      setVisibilityBusyId(postId);
      try {
        await patchPostVisibility(postId, next);
      } catch (e) {
        if (evict) {
          setPostsRetryKey((k) => k + 1);
        } else {
          applyVisibilityLocal(postId, prevVis);
        }
        setVisibilityError(mapApiReadError(e, t, "community_post_visibility_change_failed"));
      } finally {
        setVisibilityBusyId(null);
      }
    },
    [t, applyVisibilityLocal, apiPosts, postsVisFilter, setApiPosts, removeFromPin, setCommentPost, setDetailPost],
  );

  const handleGridVisibilityChange = useCallback(
    (postId: string, next: CommunityPostUserVisibility) => {
      void handlePostVisibilityChange(postId, next);
    },
    [handlePostVisibilityChange],
  );

  const openPostDetail = useCallback(
    (post: CommunityPost, trigger?: HTMLElement | null) => {
      communityOpenPostDetail({
        post,
        trigger: trigger ?? undefined,
        focusComments: false,
        focusReturnTargetRef,
        setDetailFocusComments,
        setCommentPost,
        setDetailPost,
      });
    },
    [focusReturnTargetRef],
  );

  return {
    t,
    isLoggedIn,
    authPending,
    meUser,
    loading,
    myPosts,
    postsLoadError,
    postsListTruncated,
    postsHasMore,
    postsLoadMoreBusy,
    loadMorePosts,
    setPostsRetryKey,
    postsVisFilter,
    setPostsVisFilter,
    deleteError,
    visibilityError,
    deleteBusyId,
    visibilityBusyId,
    commentPost,
    detailPost,
    setDetailPost,
    reportContext,
    handleReport,
    handleReportComment,
    closeReportDrawer,
    handleReportSubmit,
    reportSendFailed,
    reportErrorMessage,
    reportFieldMessages,
    clearReportSendError,
    reportNoticeBanner,
    reportSuccessFollowUp,
    commentsForPost,
    commentsForDetail,
    apiCommentsByPostId,
    handleCommentSend,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    commentsLoadError,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    handleLike,
    handleCollect,
    likedIds,
    collectedIds,
    mePostsInteractionToast,
    closeWithFocusReturn,
    setCommentPost,
    confirmDeletePost,
    deleteConfirmPostId,
    deleteConfirmBusy,
    cancelDeletePost,
    confirmDeletePostAction,
    handlePostVisibilityChange,
    handleGridVisibilityChange,
    openPostDetail,
    pinPostToTop,
    detailFocusComments,
    setDetailFocusComments,
  };
}
