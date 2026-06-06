"use client";

import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { CommunityCommentSort } from "@/lib/apiClient/community";
import { useCommunityDrawerCommentsQuery } from "@/components/community/useCommunityDrawerCommentsQuery";
import { useCommunityPostReport } from "@/components/community/useCommunityPostReport";
import { communityOpenPostDetail } from "@/components/community/communityOpenPostDetail";
import type { CommunityMeUser } from "@/components/community/CommunityAuthContext";
import type { CommunityComment, CommunityPost } from "@/lib/communityMockData";
import type { LocaleTranslateFn } from "@/lib/i18n";
import {
  useCommunityMePageCommentSend,
  type CommunityMeCommentSendLogContext,
} from "@/app/community/me/useCommunityMePageCommentSend";

/** Hub 玻璃抽屉与独立页同源：PostDetailDrawer + 评论/举报（P1-03 · ①） */
export function useCommunityMeDrawerPostDetail(args: {
  logContext: CommunityMeCommentSendLogContext;
  loginReturnPath: string;
  isLoggedIn: boolean;
  authPending: boolean;
  meUser: CommunityMeUser | null;
  t: LocaleTranslateFn;
  setApiPosts: Dispatch<SetStateAction<CommunityPost[]>>;
}) {
  const { logContext, loginReturnPath, isLoggedIn, authPending, meUser, t, setApiPosts } = args;
  const router = useRouter();
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [detailFocusComments, setDetailFocusComments] = useState(false);
  const [commentsRetryTick, setCommentsRetryTick] = useState(0);
  const [commentSort, setCommentSort] = useState<CommunityCommentSort>("chronological");
  const focusReturnTargetRef = useRef<HTMLElement | null>(null);

  const loginRedirect = useCallback(() => {
    router.push(`/auth/login?returnUrl=${encodeURIComponent(loginReturnPath)}`);
  }, [router, loginReturnPath]);

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
  } = useCommunityPostReport(isLoggedIn, loginRedirect, t);

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
    logContext,
  });

  const {
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
  } = useCommunityMePageCommentSend(
    logContext,
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

  const openPostDetail = useCallback(
    (post: CommunityPost, trigger?: HTMLElement | null, focusComments = false) => {
      communityOpenPostDetail({
        post,
        trigger,
        focusComments,
        focusReturnTargetRef,
        setDetailFocusComments,
        setCommentPost,
        setDetailPost,
      });
    },
    [],
  );

  return {
    commentPost,
    setCommentPost,
    detailPost,
    setDetailPost,
    detailFocusComments,
    setDetailFocusComments,
    commentsRetryTick,
    setCommentsRetryTick,
    commentSort,
    setCommentSort,
    apiCommentsByPostId,
    commentsLoadError,
    commentsHasMore,
    loadMoreComments,
    commentsLoadMoreBusy,
    commentsForDetail,
    commentSendFailed,
    commentSendErrorMessage,
    commentFieldMessages,
    clearCommentSendError,
    handleCommentSend,
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
    closeWithFocusReturn,
    openPostDetail,
  };
}
