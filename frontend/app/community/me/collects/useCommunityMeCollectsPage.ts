"use client";

import { useTranslation } from "@/components/LocaleProvider";
import { type CommunityCommentSort } from "@/lib/apiClient/community";
import { useCommunityMeCollectsHydratedList } from "@/lib/useCommunityMeCollectsHydratedList";
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

import { useCommunityMeCollectUncollectFlow } from "@/components/me/communityMeNotes/useCommunityMeCollectUncollectFlow";
import { useCommunityMePageSessionPin } from "@/lib/communityMePageSessionPin";
import { useCommunityMeCollectsPageCommentSend } from "./useCommunityMeCollectsPageCommentSend";

import type { LocaleTranslateFn } from "@/lib/i18n";

export type CommunityMeCollectsPageViewModel = {
  t: LocaleTranslateFn;
  isLoggedIn: boolean;
  authPending: boolean;
  meUser: ReturnType<typeof useCommunityAuth>["user"];
  loading: boolean;
  collectedPosts: CommunityPost[];
  collectedPostsForGrid: CommunityPost[];
  pinCollectToTop: (postId: string) => void;
  listLoadError: string | null;
  partialHint: string | null;
  collectsListTruncated: boolean;
  collectsHasMore: boolean;
  collectsLoadMoreBusy: boolean;
  loadMoreCollects: () => void;
  setCollectsRetryKey: Dispatch<SetStateAction<number>>;
  apiCommentsByPostId: ReturnType<typeof useCommunityDrawerCommentsQuery>["apiCommentsByPostId"];
  likedIds: Set<string>;
  collectedIds: Set<string>;
  handleLike: (id: string, hint?: { serverLiked?: boolean }) => void | Promise<void>;
  handleCollect: (id: string, hint?: { serverCollected?: boolean }) => void | Promise<void>;
  commentPost: CommunityPost | null;
  detailPost: CommunityPost | null;
  onCommentClick: (post: CommunityPost, trigger?: HTMLElement | null) => void;
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
  commentsForPost: CommunityComment[];
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
  requestUncollect: (postId: string, trigger?: HTMLElement | null) => void;
  uncollectConfirmPostId: string | null;
  uncollectConfirmBusy: boolean;
  cancelUncollect: () => void;
  confirmUncollect: () => void;
};

export function useCommunityMeCollectsPage(): CommunityMeCollectsPageViewModel {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoggedIn, isLoading: authPending, user: meUser } = useCommunityAuth();
  const [collectsRetryKey, setCollectsRetryKey] = useState(0);
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);

  const {
    apiPosts,
    setApiPosts,
    setCollectIds,
    loading,
    listLoadError,
    partialHint,
    collectsListTruncated,
    collectsHasMore,
    collectsLoadMoreBusy,
    loadMoreCollects,
  } = useCommunityMeCollectsHydratedList({
    retryKey: collectsRetryKey,
    t,
    isLoggedIn,
    authPending,
  });

  const collectedPosts = apiPosts;
  const { itemsForGrid: collectedPostsForGrid, pinToTop: pinCollectToTop, removeFromPin } = useCommunityMePageSessionPin(
    collectedPosts,
    (p) => p.id,
  );
  const collectedIdList = useMemo(() => collectedPosts.map((p) => p.id), [collectedPosts]);

  const { handleLike, handleCollect, likedIds, collectedIds, interactionToast } = useCommunityPostLikeCollect(t, {
    initialCollectedIds: collectedIdList,
    postsForLikeSync: collectedPosts,
    detailPostForLikeSync: detailPost,
    onCollectResolved: (postId, nowCollected) => {
      if (!nowCollected) {
        setApiPosts((prev) => prev.filter((p) => p.id !== postId));
        setCollectIds((prev) => prev.filter((id) => id !== postId));
        removeFromPin(postId);
        setDetailPost((d) => (d?.id === postId ? null : d));
      }
    },
  });

  const {
    uncollectConfirmPostId,
    uncollectConfirmBusy,
    requestUncollect,
    cancelUncollect,
    confirmUncollect,
  } = useCommunityMeCollectUncollectFlow((postId) => handleCollect(postId));

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
  } = useCommunityPostReport(isLoggedIn, () => router.push("/auth/login?returnUrl=/community/me/collects"), t);

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
    logContext: "CommunityMeCollects",
  });

  const {
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
  } = useCommunityMeCollectsPageCommentSend(
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

  const onCommentClick = useCallback((post: CommunityPost, trigger?: HTMLElement | null) => {
    communityOpenPostDetail({
      post,
      trigger,
      focusComments: true,
      focusReturnTargetRef,
      setDetailFocusComments,
      setCommentPost,
      setDetailPost,
    });
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
    collectedPosts,
    collectedPostsForGrid,
    pinCollectToTop,
    listLoadError,
    partialHint,
    collectsListTruncated,
    collectsHasMore,
    collectsLoadMoreBusy,
    loadMoreCollects,
    setCollectsRetryKey,
    apiCommentsByPostId,
    likedIds,
    collectedIds,
    handleLike,
    handleCollect,
    commentPost,
    detailPost,
    onCommentClick,
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
    commentsForPost,
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
    requestUncollect,
    uncollectConfirmPostId,
    uncollectConfirmBusy,
    cancelUncollect,
    confirmUncollect,
  };
}
