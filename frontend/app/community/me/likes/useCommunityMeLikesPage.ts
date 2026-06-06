"use client";

import { type CommunityCommentSort } from "@/lib/apiClient/community";
import { useCommunityMeLikesHydratedList } from "@/lib/useCommunityMeLikesHydratedList";
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import { useCommunityAuth } from "@/components/community/CommunityAuthContext";
import { useCommunityPostLikeCollect } from "@/components/community/useCommunityPostLikeCollect";
import {
  useState,
  useCallback,
  useRef,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { communityOpenPostDetail } from "@/components/community/communityOpenPostDetail";
import { useTranslation } from "@/components/LocaleProvider";
import { useCommunityMeLikesPageCommentSend } from "./useCommunityMeLikesPageCommentSend";
import { useCommunityMeLikesUnlikeFlow } from "@/components/me/communityMeNotes/useCommunityMeLikesUnlikeFlow";
import { useCommunityMePageSessionPin } from "@/lib/communityMePageSessionPin";
import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityMeLikesPageViewModel = {
  t: LocaleTranslateFn;
  isLoggedIn: boolean;
  authPending: boolean;
  meUser: ReturnType<typeof useCommunityAuth>["user"];
  loading: boolean;
  likedPosts: CommunityPost[];
  likedPostsForGrid: CommunityPost[];
  pinLikeToTop: (postId: string) => void;
  listLoadError: string | null;
  partialHint: string | null;
  likesListTruncated: boolean;
  likesHasMore: boolean;
  likesLoadMoreBusy: boolean;
  loadMoreLikes: () => void;
  setLikesRetryKey: Dispatch<SetStateAction<number>>;
  apiCommentsByPostId: ReturnType<typeof useCommunityDrawerCommentsQuery>["apiCommentsByPostId"];
  likedIds: Set<string>;
  collectedIds: Set<string>;
  handleLike: (id: string, hint?: { serverLiked?: boolean }) => void | Promise<void>;
  handleCollect: (id: string, hint?: { serverCollected?: boolean }) => void | Promise<void>;
  commentPost: CommunityPost | null;
  detailPost: CommunityPost | null;
  onViewFull: (post: CommunityPost, trigger?: HTMLElement | null) => void;
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
  commentsForDetail: CommunityComment[];
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
  interactionToast: string | null;
  closeWithFocusReturn: (clear: () => void) => void;
  setCommentPost: Dispatch<SetStateAction<CommunityPost | null>>;
  setDetailPost: Dispatch<SetStateAction<CommunityPost | null>>;
  detailFocusComments: boolean;
  setDetailFocusComments: Dispatch<SetStateAction<boolean>>;
  requestUnlike: (postId: string, trigger?: HTMLElement | null) => void;
  unlikeConfirmPostId: string | null;
  unlikeConfirmBusy: boolean;
  cancelUnlike: () => void;
  confirmUnlike: () => void;
};

export function useCommunityMeLikesPage(): CommunityMeLikesPageViewModel {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [likesRetryKey, setLikesRetryKey] = useState(0);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);

  const {
    apiPosts,
    setApiPosts,
    setLikeIds,
    loading,
    listLoadError,
    partialHint,
    likesListTruncated,
    likesHasMore,
    likesLoadMoreBusy,
    loadMoreLikes,
  } = useCommunityMeLikesHydratedList({
    retryKey: likesRetryKey,
    t,
    isLoggedIn,
    authPending,
  });

  const likedPosts = apiPosts;
  const { itemsForGrid: likedPostsForGrid, pinToTop: pinLikeToTop, removeFromPin } = useCommunityMePageSessionPin(
    likedPosts,
    (p) => p.id,
  );
  const postsForLikeSync = useMemo(
    () =>
      likedPosts.map((p) => ({
        id: p.id,
        likedByMe: true,
        collectedByMe: p.collectedByMe,
      })),
    [likedPosts],
  );

  const { handleLike, handleCollect, likedIds, collectedIds, interactionToast } = useCommunityPostLikeCollect(t, {
    postsForLikeSync,
    detailPostForLikeSync: detailPost,
    onLikeResolved: (postId, nowLiked) => {
      if (!nowLiked) {
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        setLikeIds((prev) => prev.filter((id) => id !== postId));
        removeFromPin(postId);
        setDetailPost((d) => (d?.id === postId ? null : d));
      }
    },
  });

  const {
    unlikeConfirmPostId,
    unlikeConfirmBusy,
    requestUnlike,
    cancelUnlike,
    confirmUnlike,
  } = useCommunityMeLikesUnlikeFlow((postId) => handleLike(postId));

  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

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
  } = useCommunityPostReport(isLoggedIn, () => router.push("/auth/login?returnUrl=/community/me/likes"), t);

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
    logContext: "CommunityMeLikes",
  });

  const {
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
  } = useCommunityMeLikesPageCommentSend(
    postIdOpen,
    commentPost,
    detailPost,
    meUser,
    t,
    setApiCommentsByPostId,
    setApiPosts,
    setDetailPost,
    setCommentPost,
    setCommentsRetryTick,
  );

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

  const onViewFull = useCallback((post: CommunityPost, trigger?: HTMLElement | null) => {
    communityOpenPostDetail({
      post,
      trigger,
      focusComments: false,
      focusReturnTargetRef,
      setDetailFocusComments,
      setCommentPost,
      setDetailPost,
    });
  }, []);

  return {
    t,
    isLoggedIn,
    authPending,
    meUser,
    loading,
    likedPosts,
    likedPostsForGrid,
    pinLikeToTop,
    listLoadError,
    partialHint,
    likesListTruncated,
    likesHasMore,
    likesLoadMoreBusy,
    loadMoreLikes,
    setLikesRetryKey,
    apiCommentsByPostId,
    likedIds,
    collectedIds,
    handleLike,
    handleCollect,
    commentPost,
    detailPost,
    onViewFull,
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
    commentsForDetail,
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
    interactionToast,
    closeWithFocusReturn,
    setCommentPost,
    setDetailPost,
    detailFocusComments,
    setDetailFocusComments,
    requestUnlike,
    unlikeConfirmPostId,
    unlikeConfirmBusy,
    cancelUnlike,
    confirmUnlike,
  };
}
